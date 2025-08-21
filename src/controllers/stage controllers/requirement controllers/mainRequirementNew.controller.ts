import { Request, Response } from 'express';
import { DocUpload, RoleBasedRequest } from '../../../types/types';
import { Items, RequirementFormModel } from '../../../models/Stage Models/requirment model/mainRequirementNew.model';
import { Types } from "mongoose"
import { populateWithAssignedToField } from '../../../utils/populateWithRedis';
import crypto from "crypto"
import { handleSetStageDeadline, timerFunctionlity } from '../../../utils/common features/timerFuncitonality';
import { syncSiteMeasurement } from '../site measurement controller/siteMeasurements.controller';
import { addOrUpdateStageDocumentation } from '../../documentation controller/documentation.controller';
import { updateProjectCompletionPercentage } from '../../../utils/updateProjectCompletionPercentage ';
import { syncAdminWall, syncWorkerWall } from '../../Wall Painting controllers/adminWallPainting.controller';
import redisClient from '../../../config/redisClient';
import { syncMaterialRoomSelectionStage } from '../material Room confirmation/materialRoomConfirmation.controller';



export const syncRequirmentForm = async (projectId: string | Types.ObjectId) => {
    const form = await RequirementFormModel.findOne({ projectId })

    if (!form) {
        await RequirementFormModel.create({
            projectId,
            shareToken: null,
            assignedTo: null,
            clientData: {
                clientName: "",
                email: "",
                whatsapp: "",
                location: "",
            },
            isEditable: true, // ✅ your default
            status: "pending", // ✅ your default
            rooms: [],
            timer: {
                startedAt: new Date(),
                completedAt: null,
                deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                reminderSent: false,
            },
            uploads: [],
        });
    }
    else {
        form.timer.startedAt = new Date()
        form.timer.completedAt = null
        form.timer.deadLine = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            form.timer.reminderSent = false
        await form.save()
    }
    const redisMainKey = `stage:RequirementFormModel:${projectId}`
    await redisClient.del(redisMainKey)

}

export const submitRequirementForm = async (req: Request, res: Response,): Promise<void> => {
    try {
        const { projectId } = req.params
        const { token } = req.query;
        const { clientData } = req.body;


        if (!token || typeof token !== "string") {
            res.status(400).json({ ok: false, message: "Missing or invalid share token." });
            return;
        }

        // Validate required client info
        if (!clientData?.clientName || !clientData?.whatsapp) {
            res.status(400).json({
                success: false,
                message: "Missing required client information.",
            });
            return;
        }

        const form = await RequirementFormModel.findOne({ projectId })

        if (!form) {
            res.status(404).json({ ok: false, message: "Form not found or token invalid." });
            return;
        }

        if (form.shareTokenExpiredAt && new Date() > form.shareTokenExpiredAt) {
            res.status(410).json({ message: "This form link has expired.", ok: false });
            return
        }

        // if (form?.clientConfirmed) {
        //   res.status(400).json({ message: "This form has already been submitted by another client.", ok: false });
        //   return
        // }



        form.clientData = {
            clientName: clientData.clientName,
            email: clientData.email || null,
            whatsapp: clientData.whatsapp,
            location: clientData?.location || "",
        };
        form.clientConfirmed = true;
        // timerFunctionlity(form, "startedAt")
        form.shareTokenExpiredAt = new Date();

        await form.save();

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

        res.status(201).json({ ok: true, message: "Requirement form submitted successfully.", data: form, });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: "Server error, try again after some time", error: error.message, });
        return
    }
};


export const createRoomRequirement = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params

        const { roomName } = req.body;

        if (!projectId || !roomName) {
            return res.status(400).json({ ok: false, message: "ProjectId and roomName are required" });
        }

        // Check if roomName already exists in this project
        const existingDoc = await RequirementFormModel.findOne({ projectId });

        if (!existingDoc) {
            return res.status(404).json({ ok: false, message: "Requirement form not found for this project" });
        }

        const roomExists = existingDoc.rooms.some(room => room.roomName.toLowerCase() === roomName.toLowerCase());

        if (roomExists) {
            return res.status(400).json({ ok: false, message: "Room with this name already exists" });
        }

        // Add new room
        existingDoc.rooms.push({ roomName, items: [], uploads: [] });
        await existingDoc.save();


        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: existingDoc })


        return res.status(201).json({ message: "Room created successfully", data: existingDoc.rooms, ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



export const deleteRoomRequirement = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "ProjectId and roomId are required" });
        }

        // Find the document
        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Requirement form not found for this project" });
        }

        // Find the room
        const room = (doc.rooms as any).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        // Remove the room
        room.deleteOne(); // or room.remove() for older Mongoose versions

        await doc.save();

        // Update Redis cache
        await populateWithAssignedToField({
            stageModel: RequirementFormModel,
            projectId,
            dataToCache: doc
        });

        return res.status(200).json({
            ok: true,
            message: "Room deleted successfully",
            data: doc.rooms
        });
    } catch (error) {
        console.error("Delete Room Error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};





export const updateRoomItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        let { projectId, roomId, itemId } = req.params
        const { itemName, quantity, unit } = req.body;

        if (!projectId || !roomId || !itemId) {
            return res.status(400).json({ message: "projectId, roomId, itemId  are required required" });
        }


        if (!itemName) {
            return res.status(400).json({ message: "item name is required required" });
        }

        // console.log("item id", itemId)

        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Requirement form not found" });

        // Find room
        const room = (doc.rooms as any).id(roomId);
        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        // Update key or value. Because your items schema has itemName and quantity, let's handle that:

        if (itemId !== "null") {
            // console.log("gtting into this ")
            // Update existing item
            const item = room.items.id(itemId);
            if (!item) return res.status(404).json({ ok: false, message: "Item not found" });

            // Update the field

            item.itemName = itemName.trim();

            item.quantity = quantity;

            item.unit = unit

            await doc.save();

            await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: doc })


            return res.status(200).json({ ok: true, message: "Item updated successfully", data: item });
        } else {
            // Add new item to items array
            const newItem: any = {};


            const isExists = room.items.find((item: Items) => {
                // console.log("itmem", item.itemName.trim().toLowerCase())
                // console.log("itmem from input", itemName.toLowerCase())
                return item.itemName.toLowerCase().trim() === itemName.toLowerCase().trim()
            })

            if (isExists) {
                return res.status(409).json({ message: "Room Item already exists", ok: false })
            }

            newItem.itemName = itemName.trim();
            newItem.quantity = quantity; // default quantity
            newItem.unit = unit

            room.items.push(newItem);
            await doc.save();

            // Return the newly added item (last in array)
            const addedItem = room.items[room.items.length - 1];
            await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: doc })

            return res.status(201).json({ ok: true, message: "Item added successfully", data: addedItem });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};




export const deleteRoomItemController = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomId, itemId } = req.params;

        if (!projectId || !roomId || !itemId) {
            return res.status(400).json({ ok: false, message: "Missing required parameters" });
        }

        // Find the document for this project
        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Requirement form not found" });
        }

        // Find the specific room
        const room = (doc.rooms as any).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        // Remove the item from the room's items array
        room.items = room.items.filter((item: any) => item._id.toString() !== itemId);

        // Save changes
        await doc.save();

        // Update cache if needed
        await populateWithAssignedToField({
            stageModel: RequirementFormModel,
            projectId,
            dataToCache: doc
        });

        return res.status(200).json({ ok: true, message: "Item deleted successfully", data: room });
    } catch (error) {
        console.error("Delete Room Item Error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};



export const getAllInfo = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        if (!projectId) return res.status(400).json({ ok: false, message: "projectId required" });

        const redisKeyMain = `stage:RequirementFormModel:${projectId}`
        // await redisClient.del(redisKeyMain)
        const redisCache = await redisClient.get(redisKeyMain)

        if (redisCache) {
            return res.json({ ok: true, message: "form fetchd form cache", data: JSON.parse(redisCache) })
        }


        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Requirement form not found" });

        return res.status(200).json({ data: doc, ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};



export const getSingleRoom = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "projectId and roomId required" });
        }



        const redisKeyMain = `stage:RequirementFormModel:${projectId}`;
        const redisCache = await redisClient.get(redisKeyMain);

        if (redisCache) {
            const parsedCache = JSON.parse(redisCache);

            // Find the room by _id
            const cachedRoom = parsedCache.rooms?.find(
                (room: any) => room._id.toString() === roomId.toString()
            );

            if (!cachedRoom) {
                return res.status(404).json({ ok: false, message: "Room not found in cache" });
            }

            return res.json({
                ok: true,
                message: "Room fetched from cache",
                data: cachedRoom
            });
        }

        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Requirement form not found" });

        let room = (doc.rooms as any).id(roomId.toString());

        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        return res.status(200).json({ data: room, ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};




export const generateShareableFormLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ ok: false, message: "Invalid project ID" });
        }

        // Generate unique token
        const token = crypto.randomBytes(16).toString("hex");

        // Save token to DB in requirement form with status draft if it doesn't exist
        let form = await RequirementFormModel.findOne({ projectId });

        if (!form) {
            res.status(404).json({ ok: false, message: "Form not found" });
            return;
        }

        if (form?.clientConfirmed) {
            res.status(400).json({ ok: false, message: "Client Has confirmed, Cannot generate new link." });
            return
        }

        form.shareTokenExpiredAt = null
        form.shareToken = process.env.NODE_ENV === "development" ?
            `${process.env.FRONTEND_URL}/requirementform/${projectId}/token=${token}`
            :
            `${process.env.FRONTEND_URL}/requirementform/${projectId}/token=${token}`



        await form.save();
        // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
        // await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

        const link = `${process.env.FRONTEND_URL}/requirementform/${projectId}/${token}`;

        return res.status(200).json({ ok: true, data: link });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};





export const markFormAsCompleted = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { formId, projectId } = req.params;
        const form = await RequirementFormModel.findById(formId);

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        // if (form.status === "completed") {
        //     return res.status(400).json({ ok: false, message: "Stage already completed" });
        // }

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            await syncSiteMeasurement(projectId, form.rooms)
            await syncMaterialRoomSelectionStage(projectId)

            // const uploadedFiles: DocUpload[] = form.uploads.map((upload: any) => ({ type: upload.type, originalName: upload.originalName, url: upload.url }))
            // await addOrUpdateStageDocumentation({
            //     projectId,
            //     stageNumber: "1", // ✅ Put correct stage number here
            //     description: "Requirement Form marked as completed",
            //     uploadedFiles, // optionally add files here
            // })
        }

        // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
        // await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })


        res.status(200).json({ ok: true, message: "Requirement stage marked as completed", data: form });
        updateProjectCompletionPercentage(projectId);
        await syncWorkerWall(projectId)
        await syncAdminWall(projectId)
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


// Mark form stage as completed (finalize the requirement gathering step)
export const setRequirementStageDeadline = (req: RoleBasedRequest, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: RequirementFormModel,
        stageName: "Requirement Form"
    });
};





export const deleteRequirementStageFile = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, fileId } = req.params;

        const doc = await RequirementFormModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "requriement stage not found" });

        // const file = doc.uploads.find((file: any) => file._id.toString() === fileId);

        const index = doc.uploads.findIndex((upload: any) => upload._id?.toString() === fileId);
        if (index === -1) return res.status(404).json({ ok: false, message: "File not found" });

        doc.uploads.splice(index, 1);
        await doc.save();
        // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
        // await redisClient.set(redisKeyMain, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: doc })


        return res.status(200).json({ ok: true, message: "File deleted successfully" });
    } catch (err) {
        console.error("Error deleting uploaded file:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



export const uploadRequirementSectionFilesController = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { projectId, sectionName } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded", ok: false });
        }


        const form: any = await RequirementFormModel.findOne({ projectId });
        if (!form) return res.status(404).json({ message: "Document not found", ok: false });


        // const doc = form.rooms

        // ⚠️ Check if section exists. If not, initialize it with empty uploads
        const room = form.rooms.find((r: any) => r.roomName.toLowerCase() === sectionName.toLowerCase());

        if (!room) {
            return res.status(404).json({ message: `Room with name '${sectionName}' not found`, ok: false });
        }

        // Make sure uploads array exists
        if (!Array.isArray(room.uploads)) {
            room.uploads = [];
        }

        // Push new uploads
        for (const file of files) {
            const fileType = file.mimetype.includes("pdf") ? "pdf" : "image";
            const location =
                (file as any).transforms?.[0]?.location || (file as any).location;

            room.uploads.push({
                _id: new Types.ObjectId(),
                type: fileType,
                url: location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            });
        }


        await form.save();

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

        return res.status(200).json({
            ok: true,
            message: "Files uploaded to section",
            count: files.length,
        });
    } catch (err) {
        console.error("Upload Section Error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};

export const deleteRequirementSectionFileController = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { projectId, sectionName, fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ message: "Missing fileId", ok: false });
        }


        // console.log("fileId", fileId)

        const doc: any = await RequirementFormModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ message: "Document not found", ok: false });


        const room = doc.rooms.find((r: any) => r.roomName.toLowerCase() === sectionName.toLowerCase());

        if (!room) {
            return res.status(404).json({ message: `Room with name '${sectionName}' not found`, ok: false });
        }

        // Filter uploads to remove file with fileId
        room.uploads = room?.uploads?.filter((file: any) => {
            return !file._id.equals(fileId);
        });

        await doc.save();

        await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: doc })

        return res.status(200).json({
            ok: true,
            message: "File deleted from section",
            section: sectionName,
        });
    } catch (err) {
        console.error("Delete Section File Error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};

