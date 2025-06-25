import { Request, Response } from "express";
import mongoose from "mongoose";
import MaterialRoomConfirmationModel, {
    IMaterialRoomConfirmation,
    IPredefinedRoom,
    ICustomRoom,
} from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import OrderingMaterialModel, { IUploadFile } from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import PaymentConfirmationModel from './../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import { IMaterialOrderingRoom, IMaterialOrderingTimer, IOrderingItem } from './../../../models/Stage Models/Ordering Material Model/orderingMaterial.model';
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

export const syncOrderingMaterials = async (projectId: string) => {

    // 2. Fetch the confirmation doc
    const confirmation = await MaterialRoomConfirmationModel.findOne<IMaterialRoomConfirmation>({ projectId });
    if (!confirmation) {
        throw new Error("No material confirmation found for this project.");
    }

    // 3. Build an array of IMaterialOrderingRoom
    const rooms: IMaterialOrderingRoom[] = [];

    // 3a. Predefined rooms (confirmation.rooms)
    confirmation.rooms.forEach((r: IPredefinedRoom) => {
        // assume r.roomFields.materials is the array of selected materials
        const selected: any[] = Array.isArray(r.roomFields?.materials) ? r.roomFields.materials : [];
        if (selected.length === 0) return; // skip rooms with no materials

        const orderingMaterials: IOrderingItem[] = selected.map(mat => ({
            name: String(mat.name),
            brand: mat.brand ?? null,
            quantity: mat.quantity ?? null,
            unit: mat.unit ?? null,
            sellerName: mat.sellerName ?? "",
            sellerPhoneNo: mat.sellerPhoneNo ?? "",
            isOrdered: false,
            notes: mat.notes ?? null,
        }));

        rooms.push({
            roomName: r.name,
            materials: orderingMaterials,
            uploads: r.uploads.map(u => ({
                type: u.type,
                url: u.url,
                originalName: u.originalName,
                uploadedAt: u.uploadedAt,
            })),
            additionalNotes: null,
        });
    });

    // 3b. Custom rooms (confirmation.customRooms)
    confirmation.customRooms.forEach((cr: ICustomRoom) => {
        if (!Array.isArray(cr.items) || cr.items.length === 0) return;

        const orderingMaterials: IOrderingItem[] = cr.items.map(item => ({
            name: item.itemKey,
            brand: null,
            quantity: item.quantity,
            unit: item.unit ?? null,
            sellerName: "",
            sellerPhoneNo: "",
            isOrdered: false,
            notes: item.remarks ?? null,
        }));

        rooms.push({
            roomName: cr.name,
            materials: orderingMaterials,
            uploads: cr.uploads.map(u => ({
                type: u.type,
                url: u.url,
                originalName: u.originalName,
                uploadedAt: u.uploadedAt,
            })),
            additionalNotes: null,
        });
    });

    // 4. Upsert OrderingMaterialModel
    const existing = await OrderingMaterialModel.findOne({ projectId });

    if (!existing) {
        // create fresh
        const timer: IMaterialOrderingTimer = {
            startedAt: new Date(),
            completedAt: null,
            deadLine: null,
            reminderSent: false,
        };

        await OrderingMaterialModel.create({
            projectId: projectId,
            status: "pending",
            isEditable: true,
            rooms,
            timer,
        });
    } else {
        // merge: preserve uploads & notes for rooms that already exist
        const byName = new Map(existing.rooms.map(r => [r.roomName, r]));

        const merged: IMaterialOrderingRoom[] = rooms.map(room => {
            const prev = byName.get(room.roomName);
            if (!prev) return room; // new room

            // Merge materials: append only new items by `name`
            const existingNames = new Set(prev.materials.map(m => m.name));
            const newMaterials = room.materials.filter(m => !existingNames.has(m.name));

            return {
                roomName: room.roomName,
                materials: [...prev.materials, ...newMaterials],
                uploads: prev.uploads, // preserve
                additionalNotes: prev.additionalNotes, // preserve
            };
        });


        existing.rooms = merged;
        await existing.save();
    }
};


 const updateOrderMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, materialName } = req.params;
    const { sellerName, sellerPhoneNo, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid roomId" });
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "OrderingMaterialModel not found" });

    const room = doc.rooms.find((r:any) => r._id.toString() === roomId);
    if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

    const material = room.materials.find(m => m.name === materialName);
    if (!material) return res.status(404).json({ ok: false, message: "Material not found" });

    if (sellerName !== undefined) material.sellerName = sellerName;
    if (sellerPhoneNo !== undefined) material.sellerPhoneNo = sellerPhoneNo;
    if (notes !== undefined) material.notes = notes;

    await doc.save();
    return res.status(200).json({ ok: true, message: "Material info updated", data: material });

  } catch (err: any) {
    console.error("Update Material Error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};



const updateOrderMaterialIsOrdered = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, materialName } = req.params;
    const { isOrdered } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid roomId" });
    }

    if (typeof isOrdered !== "boolean") {
      return res.status(400).json({ ok: false, message: "isOrdered must be boolean" });
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "OrderingMaterialModel not found" });

    const room = doc.rooms.find((r:any) => r._id.toString() === roomId);
    if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

    const material = room.materials.find(m => m.name === materialName);
    if (!material) return res.status(404).json({ ok: false, message: "Material not found" });

    material.isOrdered = isOrdered;

    await doc.save();
    return res.status(200).json({
      ok: true,
      message: `Material marked as ${isOrdered ? "ordered" : "not ordered"}`,
      data: { name: material.name, isOrdered }
    });

  } catch (err: any) {
    console.error("Update isOrdered Error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};


 const getOrderingMaterialStageData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required" });
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) {
      return res.status(404).json({ ok: false, message: "OrderingMaterialModel not found" });
    }

    return res.status(200).json({ ok: true, data: doc });
  } catch (err: any) {
    console.error("Get Ordering Material Error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ✅ GET a single room's details
 const getSingleOrderingRoomData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid roomId" });
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) {
      return res.status(404).json({ ok: false, message: "OrderingMaterialModel not found" });
    }

    const room = doc.rooms.find((r:any) => r._id.toString() === roomId);
    if (!room) {
      return res.status(404).json({ ok: false, message: "Room not found" });
    }

    return res.status(200).json({ ok: true, data: room });
  } catch (err: any) {
    console.error("Get Room Error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};





// COMMON STAGE CONTROLLERS

const setOrderMaterialFileStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: OrderingMaterialModel,
        stageName: "Ordering Material"
    });
};



const orderMaterialCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await OrderingMaterialModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        // if (form.status === "completed") {
        //   await autoCreateCostEstimationRooms(req, res, projectId)
        // }


        return res.status(200).json({ ok: true, message: "cost estimation stage marked as completed", data: form });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


// FILE UPLOAD CONTROLLLERS

const uploadOrderMaterialFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const doc = await OrderingMaterialModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });

        const room = doc.rooms.find((room: any) => room._id.toString() === roomId);
        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        const uploadedFiles: IUploadFile[] = (req.files as (Express.Multer.File & { location: string })[]).map(
            (file) => ({
                type: file.mimetype.includes("pdf") ? "pdf" : "image",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            })
        );

        if (!room.uploads) room.uploads = [];
        room.uploads.push(...uploadedFiles);

        await doc.save();

        return res.status(200).json({ ok: true, message: "Files uploaded successfully", data: uploadedFiles });
    } catch (err) {
        console.error("Error uploading files to cost estimation room:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



const deleteOrderMaterialFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId, fileId } = req.params;

        const doc = await OrderingMaterialModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });

        const room = doc.rooms.find((room: any) => room._id.toString() === roomId);
        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        const index = room.uploads.findIndex((upload: any) => upload._id?.toString() === fileId);
        if (index === -1) return res.status(404).json({ ok: false, message: "File not found" });

        room.uploads.splice(index, 1);
        await doc.save();

        return res.status(200).json({ ok: true, message: "File deleted successfully" });
    } catch (err) {
        console.error("Error deleting uploaded file:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

export {
    updateOrderMaterialItem,
    updateOrderMaterialIsOrdered,
    getOrderingMaterialStageData,
    getSingleOrderingRoomData,


     uploadOrderMaterialFiles,
 deleteOrderMaterialFile,
 setOrderMaterialFileStageDeadline,
 orderMaterialCompletionStatus
}