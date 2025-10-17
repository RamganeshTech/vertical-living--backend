import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { Request, Response } from "express";
import { Types } from "mongoose";
// import { validRooms } from "../installation controllers/installation.controller";
import { DocUpload, RoleBasedRequest } from "../../../types/types";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { cleaningStageCompletionStatus, syncCleaningSanitaionStage } from "../Cleaning controller/cleaning.controller";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { validRoomKeys } from "../../../constants/BEconstants";


export const syncQualityCheck = async (projectId: string, rooms: any) => {

    const existing = await QualityCheckupModel.findOne({ projectId });

    const timer = {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
    };


    if (!existing) {

        await QualityCheckupModel.create({
            projectId,
            isEditable: true,
            status: "pending",
            timer,
            assignedTo: null,

            rooms: rooms.map((room: any) => {
                return {
                    roomName: room.roomName,
                    tasks: []
                }
            }),
        })
    }
    else {
        existing.timer = timer

        const existingRoomNames = (existing?.rooms || []).map((room: any) => room?.roomName);

        // Create only missing rooms
        const newRooms = rooms
            .filter((room: any) => !existingRoomNames.includes(room.roomName))
            .map((room: any) => ({
                roomName: room.roomName,
                tasks: []
            }));

        existing.rooms = [...existing.rooms, ...newRooms];

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

        const decodedRoomName = decodeURIComponent(roomName); // ✅ this fixes it!

        console.log("decodedRoomName", decodedRoomName)

        if (!projectId || !decodedRoomName || !workName) {
            return res.status(400).json({ ok: false, message: "Missing required fields." });
        }

        // if (!validRooms.includes(roomName)) {
        //     return res.status(400).json({ ok: false, message: "Invalid room name." });
        // }


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

        // const doc: any = await QualityCheckupModel.findOneAndUpdate(
        //     { projectId },
        //     { $push: { [roomName]: newItem } },
        //     { new: true }
        // );

        console.log("newItem", newItem)

        const doc: any = await QualityCheckupModel.findOneAndUpdate(
            { projectId },
            { $push: { "rooms.$[room].tasks": newItem } },
            {
                new: true,
                arrayFilters: [{ "room.roomName": decodedRoomName }],
            }
        );
        if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });

        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${decodedRoomName}`

        // const updatedRoom = (doc as any)[decodedRoomName]
        // await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })
        const updatedRoom = doc.rooms.find((r: any) => r.roomName === decodedRoomName);

        if (updatedRoom) {
            await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
        } else {
            console.warn(`⚠️ No room found for ${decodedRoomName} in QualityCheckupModel`);
        }
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })

        return res.json({ ok: true, data: updatedRoom });
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

        const decodedRoomName = decodeURIComponent(roomName); // ✅ this fixes it!

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
        // const doc: any = await QualityCheckupModel.findOne({ projectId });
        // if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });

        // const item = doc[roomName].id(itemId);
        // if (!item) return res.status(404).json({ ok: false, message: "Item not found." });


        // if (workName) item.workName = workName;
        // if (status) item.status = status;
        // if (remarks) item.remarks = remarks;
        // item.inspectedBy = inspectedBy;
        // item.inpectedUserModel = inspectedUserModel;

        // if (req.file) {
        //     const { mimetype, location, originalname } = req.file as any;
        //     if (!mimetype.startsWith("image/")) {
        //         return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
        //     }
        //     item.upload = {
        //         type: "image",
        //         url: location,
        //         originalName: originalname,
        //         uploadedAt: new Date(),
        //     };
        // }

        // await doc.save();


        // Optional upload (image only)
        let uploadPayload: any = undefined;
        if (req.file) {
            const { mimetype, location, originalname } = req.file as any;
            if (!mimetype?.startsWith("image/")) {
                return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
            }
            uploadPayload = {
                type: "image",
                url: location,
                originalName: originalname,
                uploadedAt: new Date(),
            };
        }

        // Build $set paths for the matched room & task
        const setFields: Record<string, any> = {};
        if (typeof workName === "string") setFields["rooms.$[room].tasks.$[task].workName"] = workName;
        if (typeof status === "string") setFields["rooms.$[room].tasks.$[task].status"] = status;
        if (typeof remarks === "string") setFields["rooms.$[room].tasks.$[task].remarks"] = remarks;
        // Always stamp who edited
        setFields["rooms.$[room].tasks.$[task].inspectedBy"] = inspectedBy;
        setFields["rooms.$[room].tasks.$[task].inspectedUserModel"] = inspectedUserModel;
        if (uploadPayload) setFields["rooms.$[room].tasks.$[task].upload"] = uploadPayload;

        if (Object.keys(setFields).length === 0) {
            return res.status(400).json({ ok: false, message: "No fields to update." });
        }

        const taskObjectId = new Types.ObjectId(itemId);

        const updatedDoc = await QualityCheckupModel.findOneAndUpdate(
            {
                projectId,
                "rooms.roomName": decodedRoomName,
                "rooms.tasks._id": taskObjectId,
            },
            { $set: setFields },
            {
                new: true,
                arrayFilters: [
                    { "room.roomName": decodedRoomName },
                    { "task._id": taskObjectId },
                ],
            }
        );

        if (!updatedDoc) {
            return res.status(404).json({ ok: false, message: "Room or item not found." });
        }


        // Pull back the updated room & item to return and cache
        const room = updatedDoc.rooms.find((r: any) => r.roomName === decodedRoomName);
        const updatedItem = (room?.tasks as any).id(taskObjectId);
        if (!room || !updatedItem) {
            return res.status(404).json({ ok: false, message: "Item not found after update." });
        }


        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${decodedRoomName}`

        // const updatedRoom = (doc as any)[roomName]
        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: updatedDoc })

        await redisClient.set(redisRoomKey, JSON.stringify(room), { EX: 60 * 10 })

        return res.json({ ok: true, data: updatedItem });
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

        const decodedRoomName = decodeURIComponent(roomName); // ✅ this fixes it!


        // if (!validRooms.includes(roomName)) {
        //     return res.status(400).json({ ok: false, message: "Invalid room name." });
        // }

        // const doc = await QualityCheckupModel.findOneAndUpdate(
        //     { projectId },
        //     { $pull: { [roomName]: { _id: itemId } } },
        //     { new: true }
        // );


        const doc = await QualityCheckupModel.findOneAndUpdate(
            { projectId, "rooms.roomName": decodedRoomName },
            { $pull: { "rooms.$.tasks": { _id: itemId } } },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ ok: false, message: "Quality Checkup record not found." });
        }


        // const redisMainKey = `stage:QualityCheckupModel:${projectId}`
        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${decodedRoomName}`

        const updatedRoom = doc.rooms.find((r: any) => r.roomName === decodedRoomName);
        // const updatedRoom = (doc as any)[decodedRoomName]
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

        const decodedRoomName = decodeURIComponent(roomName); // ✅ this fixes it!


        // if (!validRooms.includes(roomName)) {
        //     return res.status(400).json({ ok: false, message: "Invalid room name." });
        // }

        const redisRoomKey = `stage:QualityCheckupModel:${projectId}:room:${decodedRoomName}`

        const cachedData = await redisClient.get(redisRoomKey)
        // await redisClient.del(redisRoomKey)
        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }



        // const doc: any = await QualityCheckupModel.findOne({ projectId });
        // const doc: any = await QualityCheckupModel.findOne(
        //     { projectId },
        //     { "room.$.roomName": roomName } // fetch only that room
        // ).lean();

        console.log("roomName", decodedRoomName)


        // const doc = await QualityCheckupModel.findOne(
        //     { projectId, "rooms.roomName": decodedRoomName },
        //     { rooms: { $elemMatch: { roomName: decodedRoomName } } } // ✅ correct
        // ).lean();



        // if (!doc) return res.status(404).json({ ok: false, message: "Quality Checkup not found." });
        // console.log("doc", doc)
        // const room = doc.rooms?.[0] ?? null;

        // if (!room) return res.status(404).json({ ok: false, message: "Room not found." });


        // // const updatedRoom = (doc as any)[decodedRoomName]
        // await redisClient.set(redisRoomKey, JSON.stringify(room), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: doc })


        // Fetch full document once
        const fullDoc = await QualityCheckupModel.findOne({ projectId }).lean();
        if (!fullDoc) return res.status(404).json({ ok: false, message: "Quality Checkup not found." });

        // Extract the requested room from the array
        const room = fullDoc.rooms?.find(r => r.roomName === decodedRoomName) ?? null;
        if (!room) return res.status(404).json({ ok: false, message: "Room not found." });

        // Cache the single room
        await redisClient.set(redisRoomKey, JSON.stringify(room), { EX: 60 * 10 });

        // Cache the full document (optional)
        await populateWithAssignedToField({ stageModel: QualityCheckupModel, projectId, dataToCache: fullDoc });


        return res.json({ ok: true, data: room || [] });
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


            // let uploadedFiles: DocUpload[] = [];




            // const roomKeys = validRoomKeys.filter((key) => {
            //     const roomItems = form?.[key];
            //     return (
            //         Array.isArray(roomItems) &&
            //         roomItems.some((item: any) => item?.upload?.url) // has at least one upload
            //     );
            // });



            // for (const room of roomKeys) {
            //     const items = form[room] || [];

            //     items.forEach((item: any) => {
            //         if (item.upload?.url) {
            //             uploadedFiles.push({
            //                 type: item.upload.type,
            //                 url: item.upload.url,
            //                 originalName: item.upload.originalName,
            //             });
            //         }
            //     });


            // }

            // if (!uploadedFiles.length) {
            //     uploadedFiles = []
            // }

            // await addOrUpdateStageDocumentation({
            //     projectId,
            //     stageNumber: "12", // Assuming 12 is for Quality Check
            //     description: "Quality Checkup documentation completed",
            //     uploadedFiles,
            // });
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