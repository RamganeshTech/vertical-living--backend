import { Request, Response } from "express";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { Types } from "mongoose";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

const getRoomById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) return res.status(404).json({ ok: false, message: "No docujjjjjjjjjjjjjjjment found" });

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId); // This uses Mongoose subdocument lookup
        // if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        console.log("im gettig called room by id", )

        return res.status(200).json({ ok: true, data: room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


const getAllMaterialRooms = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Project ID is required" });
        }


        console.log("im gettig called room by id", )


        const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

        if (!doc) {
            return res.status(404).json({ ok: false, message: "Material confirmation not found" });
        }

        return res.status(200).json({
            ok: true,
            data: doc.rooms, // only returning the list of rooms
        });
    } catch (error) {
        console.error("Error fetching material rooms:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const addMaterialRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { roomName } = req.body;

        if (!roomName || typeof roomName !== "string") {
            return res.status(400).json({ ok: false, message: "Room name is required" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });

        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        // Check for duplicate room
        const alreadyExists = materialDoc.rooms.some((room) => room.roomName === roomName);
        if (alreadyExists) {
            return res.status(400).json({ ok: false, message: "Room already exists" });
        }

        materialDoc.rooms.push({
            roomName,
            uploads: [],
            modularWorks: [],
        });

        await materialDoc.save();

        return res.status(201).json({ ok: true, message: "Room added", data: materialDoc.rooms });
    } catch (error) {
        console.error("Add Room Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const createModularWork = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;
        const { workName, notes, materials } = req.body;

        if (!workName || typeof workName !== "string") {
            return res.status(400).json({ ok: false, message: "workName is required and must be a string" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        room.modularWorks.push({
            workName,
            notes: typeof notes === "string" ? notes : null,
            materials: Array.isArray(materials) ? materials : [],
        });

        await materialDoc.save();

        return res.status(201).json({ ok: true, message: "Modular work added", data: room.modularWorks });
    } catch (error) {
        console.error("Add Modular Work Error:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const editModularWork = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId, workId } = req.params;
        const { workName, notes, materials } = req.body;

        if (workName && typeof workName !== "string") {
            return res.status(400).json({ ok: false, message: "workName must be a string" });
        }

        if (notes && typeof notes !== "string") {
            return res.status(400).json({ ok: false, message: "notes must be a string" });
        }

        if (materials && !Array.isArray(materials)) {
            return res.status(400).json({ ok: false, message: "materials must be an array of strings" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        const modularWork = room.modularWorks.id(workId);
        if (!modularWork) {
            return res.status(404).json({ ok: false, message: "Modular work not found" });
        }

        // Perform updates conditionally
        if (workName) modularWork.workName = workName;
        if (notes !== undefined) modularWork.notes = notes || null;
        if (materials) modularWork.materials = materials;

        await materialDoc.save();

        return res.status(200).json({ ok: true, message: "Modular work updated", data: modularWork });
    } catch (err) {
        console.error("Edit Modular Work Error:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const deleteModularWork = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId, workId } = req.params;

        if (!projectId || !roomId || !workId) {
            return res.status(400).json({ ok: false, message: "Missing required parameters" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        const workIndex = room.modularWorks.findIndex((work: any) => work._id.toString() === workId);
        if (workIndex === -1) {
            return res.status(404).json({ ok: false, message: "Modular work not found" });
        }

        room.modularWorks.splice(workIndex, 1);
        await materialDoc.save();

        return res.status(200).json({ ok: true, message: "Modular work deleted successfully" });
    } catch (err) {
        console.error("Delete Modular Work Error:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const deleteMaterialRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "Project ID and Room ID are required" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const roomIndex = materialDoc.rooms.findIndex((room: any) => room._id.toString() === roomId);
        if (roomIndex === -1) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        materialDoc.rooms.splice(roomIndex, 1);
        await materialDoc.save();

        return res.status(200).json({ ok: true, message: "Room deleted successfully" });
    } catch (err) {
        console.error("Delete Room Error:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



// Mark form stage as completed (finalize the requirement gathering step)
const materialSelectionCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { formId } = req.params;
        const form = await MaterialRoomConfirmationModel.findById(formId);

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        // if (form.status === "completed") {
        //   let siteMeasurement = await SiteMeasurementModel.findOne({ projectId: form.projectId });
        //   if (!siteMeasurement) {
        //     siteMeasurement = new SiteMeasurementModel({
        //       projectId: form.projectId,
        //       status: "pending",
        //       isEditable: true,
        //       timer: {
        //         startedAt: new Date(),
        //         completedAt: null,
        //         deadLine: null
        //       },
        //       uploads: [],
        //       siteDetails: {
        //         totalPlotAreaSqFt: { type: Number, default: null },
        //         builtUpAreaSqFt: { type: Number, default: null },
        //         roadFacing: { type: Boolean, default: null },
        //         numberOfFloors: { type: Number, default: null },
        //         hasSlope: { type: Boolean, default: null },
        //         boundaryWallExists: { type: Boolean, default: null },
        //         additionalNotes: { type: String, default: null }
        //       },
        //       rooms: [],
        //     });
        //   } else {
        //     siteMeasurement.status = "pending";
        //     siteMeasurement.isEditable = true;
        //     siteMeasurement.timer.startedAt = new Date();

        //   }
        //   await siteMeasurement.save()
        // }


        return res.status(200).json({ ok: true, message: "Material Selection stage marked as completed", data: form });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


// Mark form stage as completed (finalize the requirement gathering step)
const setMaterialConfirmationStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: MaterialRoomConfirmationModel,
        stageName: "Material Confirmation"
    });
};

const uploadMaterialRoomFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "Project ID and Room ID are required" });
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        const uploadedFiles = (req.files as (Express.Multer.File & { location: string })[]).map(file => ({
            type: file.mimetype.includes("pdf") ? "pdf" : "image",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date(),
        }));


        room.uploads.push(...uploadedFiles);

        await materialDoc.save();

        return res.status(200).json({
            ok: true,
            message: "Files uploaded successfully",
            data: uploadedFiles,
        });
    } catch (err) {
        console.error("Upload Room Files Error:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const deleteMaterialRoomFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fileId } = req.params;

    if (!projectId || !roomId || !fileId)
      return res.status(400).json({ ok: false, message: "Missing required parameters" });

    const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
    if (!materialDoc) return res.status(404).json({ ok: false, message: "Material document not found" });

    const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
    if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

    const uploadIndex = room.uploads.findIndex((upload:any) => upload._id?.toString() === fileId);
    if (uploadIndex === -1) return res.status(404).json({ ok: false, message: "file not found" });

    room.uploads.splice(uploadIndex, 1); // Remove the upload
    await materialDoc.save();

    return res.status(200).json({ ok: true, message: "file deleted successfully" });
  } catch (err) {
    console.error("Error deleting room upload:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};



export {
    getRoomById,
    getAllMaterialRooms,
    addMaterialRoom,
    createModularWork,
    editModularWork,
    deleteModularWork,
    deleteMaterialRoom,
    
    
    materialSelectionCompletionStatus,
    setMaterialConfirmationStageDeadline,
    uploadMaterialRoomFiles,
    deleteMaterialRoomFile
}



