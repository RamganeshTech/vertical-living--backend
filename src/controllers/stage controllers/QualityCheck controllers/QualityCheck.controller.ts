import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { validRooms } from "../installation controllers/installation.controller";
import { DocUpload, RoleBasedRequest } from "../../../types/types";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { syncCleaningSanitaionStage } from "../Cleaning controller/cleaning.controller";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";


export const syncQualityCheck = async (projectId: string) => {

    const existing = await QualityCheckupModel.findOne({ projectId });

    if (!existing) {
        const timer = {
            startedAt: null,
            completedAt: null,
            deadLine: null,
            reminderSent: false,
        };


        await QualityCheckupModel.create({
            projectId,
            isEditable: true,
            status: "pending",
            timer,
            assignedTo: null,

            LivingRoom: [],
            Bedroom: [],
            Kitchen: [],
            DiningRoom: [],
            Balcony: [],
            FoyerArea: [],
            Terrace: [],
            StudyRoom: [],
            CarParking: [],
            Garden: [],
            StorageRoom: [],
            EntertainmentRoom: [],
            HomeGym: [],
        })
    }
    else {
        existing.timer.startedAt = null
        existing.timer.deadLine = null,
            existing.timer.completedAt = null,
            existing.timer.reminderSent = false,

            await existing.save()
    }


    const redisKey = `stage:QualityCheckupModel:${projectId}`;
    await redisClient.del(redisKey);

}





// === CREATE ===
const createQualityCheckItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName } = req.params;
        const { workName, status, remarks } = req.body;

        if (!projectId || !roomName || !workName) {
            return res.status(400).json({ ok: false, message: "Missing required fields." });
        }

        if (!validRooms.includes(roomName)) {
            return res.status(400).json({ ok: false, message: "Invalid room name." });
        }


        const inspectedBy = req.user?._id;
        let inspectedUserModel = "";
        switch (req.user?.role) {
            case "owner":
                inspectedUserModel = "UserModel";
                break;
            case "CTO":
                inspectedUserModel = "CTOModel";
                break;
            case "staff":
                inspectedUserModel = "StaffModel";
                break;
            case "worker":
                inspectedUserModel = "WorkerModel";
                break;
            case "client":
                inspectedUserModel = "ClientModel";
                break;
            default:
                inspectedUserModel = "UserModel";
        }

        let validatedUpload = null;

        if (req.file) {
            const { mimetype, location, originalname } = req.file as any;
            if (!mimetype.startsWith("image/")) {
                return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
            }
            validatedUpload = {
                type: "image",
                url: location,
                originalName: originalname,
                uploadedAt: new Date(),
            };
        }

        const newItem = {
            workName,
            status: status || "pending",
            remarks: remarks || "",
            inspectedBy,
            inpectedUserModel: inspectedUserModel,
            upload: validatedUpload,
        };

        const doc: any = await QualityCheckupModel.findOneAndUpdate(
            { projectId },
            { $push: { [roomName]: newItem } },
            { new: true }
        );

        if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });

        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${roomName}`

        const updatedRoom = (doc as any)[roomName]
        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })

        return res.json({ ok: true, data: doc[roomName] });
    } catch (err: any) {
        console.error("Create QualityCheckItem:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

// === EDIT ===
const editQualityCheckItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName, itemId } = req.params;
        const { workName, status, remarks } = req.body;

        if (!projectId || !roomName || !itemId) {
            return res.status(400).json({ ok: false, message: "Missing required fields." });
        }

        if (!validRooms.includes(roomName)) {
            return res.status(400).json({ ok: false, message: "Invalid room name." });
        }

        const doc: any = await QualityCheckupModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });

        const item = doc[roomName].id(itemId);
        if (!item) return res.status(404).json({ ok: false, message: "Item not found." });

        // ✅ Authenticated user sets inspector identity if updated
        const inspectedBy = req.user?._id;
        let inspectedUserModel = "";
        switch (req.user?.role) {
            case "owner":
                inspectedUserModel = "UserModel";
                break;
            case "CTO":
                inspectedUserModel = "CTOModel";
                break;
            case "staff":
                inspectedUserModel = "StaffModel";
                break;
            case "worker":
                inspectedUserModel = "WorkerModel";
                break;
            case "client":
                inspectedUserModel = "ClientModel";
                break;
            default:
                inspectedUserModel = "UserModel";
        }


        if (workName) item.workName = workName;
        if (status) item.status = status;
        if (remarks) item.remarks = remarks;
        item.inspectedBy = inspectedBy;
        item.inpectedUserModel = inspectedUserModel;

        if (req.file) {
            const { mimetype, location, originalname } = req.file as any;
            if (!mimetype.startsWith("image/")) {
                return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
            }
            item.upload = {
                type: "image",
                url: location,
                originalName: originalname,
                uploadedAt: new Date(),
            };
        }

        await doc.save();


        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${roomName}`

        const updatedRoom = (doc as any)[roomName]
        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })

        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

        return res.json({ ok: true, data: item });
    } catch (err: any) {
        console.error("Edit QualityCheckItem:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

// === DELETE ===
const deleteQualityCheckItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomName, itemId } = req.params;

        if (!projectId || !roomName || !itemId) {
            return res.status(400).json({ ok: false, message: "Missing required fields." });
        }

        if (!validRooms.includes(roomName)) {
            return res.status(400).json({ ok: false, message: "Invalid room name." });
        }

        const doc = await QualityCheckupModel.findOneAndUpdate(
            { projectId },
            { $pull: { [roomName]: { _id: itemId } } },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });
        }


        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${roomName}`

        const updatedRoom = (doc as any)[roomName]
        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })

        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

        return res.json({ ok: true, message: "Item deleted successfully." });
    } catch (err: any) {
        console.error("Delete QualityCheckItem:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

// === GET ALL ===
const getQualityCheckup = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required." });

        const redisMainKey = `stage:QualityCheckupModel:${projectId}`

        const cachedData = await redisClient.get(redisMainKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }


        const doc = await QualityCheckupModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup not found." });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })

        return res.json({ ok: true, data: doc });
    } catch (err: any) {
        console.error("Get QualityCheckup:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

// === GET SINGLE ROOM ===
const getQualityCheckRoomItems = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomName } = req.params;

        if (!projectId || !roomName) {
            return res.status(400).json({ ok: false, message: "Project ID and room name required." });
        }

        if (!validRooms.includes(roomName)) {
            return res.status(400).json({ ok: false, message: "Invalid room name." });
        }

        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${roomName}`

        const cachedData = await redisClient.get(redisRoomKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }



        const doc: any = await QualityCheckupModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup not found." });

        const updatedRoom = (doc as any)[roomName]
        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })


        return res.json({ ok: true, data: doc[roomName] || [] });
    } catch (err: any) {
        console.error("Get Room Items:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};


// COMMON CONTOROLLER
const setQualityCheckStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: QualityCheckupModel,
        stageName: "Quality Checkup"
    });
};



const qualityCheckCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form: any = await QualityCheckupModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            await syncCleaningSanitaionStage(projectId)


            let uploadedFiles: DocUpload[] = [];


            const roomKeys = Object.keys(form.toObject() || {}).filter(
                (key) =>
                    Array.isArray(form[key]) &&
                    form[key]?.length &&
                    typeof form[key][0] === "object" &&
                    form[key][0]?.upload
            );

            for (const room of roomKeys) {
                const items = form[room] || [];

                items.forEach((item: any) => {
                    if (item.upload?.url) {
                        uploadedFiles.push({
                            type: item.upload.type,
                            url: item.upload.url,
                            originalName: item.upload.originalName,
                        });
                    }
                });


            }

            if (!uploadedFiles.length) {
                uploadedFiles = []
            }

            await addOrUpdateStageDocumentation({
                projectId,
                stageNumber: "12", // Assuming 12 is for Quality Check
                description: "Quality Checkup documentation completed",
                uploadedFiles,
            });
        }

        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: form })


        res.status(200).json({ ok: true, message: "Quality Checkup stage marked as completed", data: form });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


export {
    createQualityCheckItem,
    editQualityCheckItem,
    deleteQualityCheckItem,
    getQualityCheckup,
    getQualityCheckRoomItems,

    setQualityCheckStageDeadline,
    qualityCheckCompletionStatus
}