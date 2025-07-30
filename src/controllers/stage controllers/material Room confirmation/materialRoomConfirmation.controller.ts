import { Request, Response } from "express";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import mongoose, { Types } from "mongoose";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

import { predefinedRooms } from "../../../utils/Stage Utils/initalizeMaterialSelectionStage";
import { generateCostEstimationFromMaterialSelection } from "../cost estimation controllers/costEstimation.controller";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { DocUpload, RoleBasedRequest } from "../../../types/types";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";


export const initializeMaterialSelection = async (projectId: string) => {

  const existing = await MaterialRoomConfirmationModel.findOne({ projectId });

  const timer = {
    startedAt: new Date(),
    completedAt: null,
    deadLine: null,
    reminderSent: false,
  };


  if (!existing) {
    const rooms = predefinedRooms.map((room) => ({
      name: room.name,
      roomFields: room.fields,
      uploads: [],
    }));

    await MaterialRoomConfirmationModel.create({
      projectId,
      rooms,
      assignedTo: null,
      customRooms: [],
      status: "pending",
      isEditable: true,
      timer
    });
  }
  else {
    existing.timer = timer
    await existing.save()
  }
  const redisKey = `stage:MaterialRoomConfirmationModel:${projectId}`;
  await redisClient.del(redisKey);
};


const getMaterialRoomConfirmationByProject = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

    //  await redisClient.del(redisMainKey)
    const redisCachedData = await redisClient.get(redisMainKey)


    if (redisCachedData) {
      return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
    }


    const data = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!data) {
      return res.status(404).json({ ok: false, message: "Material Room Confirmation not found." });
    }

    // await redisClient.set(redisMainKey, JSON.stringify(data.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: data })


    return res.status(200).json({ message: "fetched all matieral confirmations successfully", ok: true, data });
  } catch (error) {
    console.error("Error fetching material room confirmation:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getSinglePredefinedRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, roomType } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room ID." });
    }


    const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`

    const redisCachedData = await redisClient.get(redisRoomKey)

    if (redisCachedData) {
      return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
    }

    const data = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!data) {
      return res.status(404).json({ ok: false, message: "Material Room Confirmation not found." });
    }

    if (roomType === "customRoom") {
      // Check in custom rooms
      const customRoom = data.customRooms.find(r => (r as any)._id?.toString() === roomId);


      if (customRoom) {
        await redisClient.set(redisRoomKey, JSON.stringify(customRoom), { EX: 60 * 10 })
        return res.status(200).json({
          ok: true,
          message: "fetched room",
          data: customRoom
        });
      }
    }
    else {
      // Check in predefined rooms
      const predefinedRoom = data.rooms.find(r => (r as any)._id?.toString() === roomId);

      if (predefinedRoom) {
        await redisClient.set(redisRoomKey, JSON.stringify(predefinedRoom), { EX: 60 * 10 })
        return res.status(200).json({
          ok: true,
          message: "fetched room",
          data: predefinedRoom
        });
      }

    }


    return res.status(404).json({ message: "Room not found.", ok: false });

  } catch (error) {
    console.error("Error fetching single room:", error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};


const updatePredefinedRoomField = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fieldKey } = req.params;
    const { quantity, unit, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room ID." });
    }

    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection not found." });
    }

    let updatedRoom = null;

    // 1. Check Predefined Rooms
    const predefinedRoom = doc.rooms.find((r: any) => r._id?.toString() === roomId);
    if (predefinedRoom) {
      const field = predefinedRoom.roomFields?.[fieldKey];
      if (!field) {
        return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in predefined room.` });
      }

      // console.log("quantity", field.quantity)
      field.quantity = quantity ?? field.quantity;
      field.unit = unit ?? field.unit;
      field.remarks = remarks ?? field.remarks;

      console.log("field after updation", field)

      doc.markModified("rooms");

      await doc.save();


      const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
      const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
      updatedRoom = predefinedRoom;
      // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
      await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })

      await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });

      return res.status(200).json({
        ok: true,
        message: `Field '${fieldKey}' in predefined room updated successfully.`,
        data: predefinedRoom
      });
    }


    console.log("fieldKey", fieldKey)
    console.log("updated data", quantity, unit, remarks)
    // 2. Check Custom Rooms
    const customRoom = doc.customRooms.find((r: any) => r._id.toString() === roomId);
    if (customRoom) {
      const item = customRoom.items.find(i => i.itemKey === fieldKey);
      if (!item) {
        return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in custom room.` });
      }

      item.quantity = quantity ?? item.quantity;
      item.unit = unit ?? item.unit;
      item.remarks = remarks ?? item.remarks;

      doc.markModified("customRooms");


      await doc.save();

      const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
      // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
      updatedRoom = customRoom;
      // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
      await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })
      await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });

      return res.status(200).json({
        ok: true,
        message: `Field '${fieldKey}' in custom room updated successfully.`,
        data: customRoom
      });
    }

    return res.status(404).json({ ok: false, message: "Room not found in either predefined or custom rooms." });

  } catch (error) {
    console.error("Error updating predefined room field:", error);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};


const createCustomRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, message: "Room name is required and must be a string." });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId." });
    }

    const materialSelection = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!materialSelection) {
      return res.status(404).json({ ok: false, message: "Material selection document not found." });
    }

    // Check for duplicate room name in customRooms
    const roomExists = materialSelection.customRooms.some(
      (room) => room.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (roomExists) {
      return res.status(400).json({ ok: false, message: "Custom room with this name already exists." });
    }

    // Add new custom room
    const newRoom = {
      name: name.trim(),
      items: [],
      uploads: [],
    };

    materialSelection.customRooms.push(newRoom);
    await materialSelection.save();

    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(materialSelection.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialSelection })


    return res.status(201).json({
      ok: true,
      message: "Custom room created successfully.",
      room: newRoom,
    });

  } catch (error) {
    console.error("Error creating custom room:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteRoom = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId." });
    }

    const updated = await MaterialRoomConfirmationModel.findOneAndUpdate(
      { projectId },
      {
        $pull: {
          rooms: { _id: roomId },
          customRooms: { _id: roomId },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Material selection document not found." });
    }


    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(materialSelection.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: updated })


    return res.status(200).json({
      ok: true,
      message: "Room deleted successfully.",
      data: updated,
    });

  } catch (error) {
    console.error("Error deleting room:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const addItemToCustomRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;
    const { itemKey, quantity, unit, remarks } = req.body;

    if (!itemKey || typeof itemKey !== "string") {
      return res.status(400).json({ ok: false, message: "Item key is required and must be a string." });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId or roomId." });
    }



    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection document not found." });
    }

    const room = doc.customRooms.find((r: any) => r._id.toString() === roomId);

    if (!room) {
      return res.status(404).json({ ok: false, message: "Custom room not found." });
    }

    const existingItem = room.items.find(i => i.itemKey.toLowerCase() === itemKey.trim().toLowerCase());

    if (existingItem) {
      return res.status(400).json({ ok: false, message: "Item key already exists in this room." });
    }

    room.items.push({
      itemKey: itemKey.trim(),
      quantity: typeof quantity === "number" ? quantity : 0,
      unit: typeof unit === "string" ? unit : "",
      remarks: typeof remarks === "string" ? remarks : "",
    });

    await doc.save();

    const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

    // ✅ Correct: updatedRoom is the room you just updated
    const updatedRoom = room;
    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })

    await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });

    return res.status(201).json({
      ok: true,
      message: "Item added to custom room successfully.",
      roomId,
      itemKey,
    });

  } catch (error) {
    console.error("Error adding item to custom room:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


const deleteCustomRoomField = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fieldKey } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room ID." });
    }



    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection not found." });
    }

    const customRoom = doc.customRooms.find((room: any) => room._id.toString() === roomId);

    if (!customRoom) {
      return res.status(404).json({ ok: false, message: "Custom room not found." });
    }

    const initialLength = customRoom.items.length;
    customRoom.items = customRoom.items.filter(item => item.itemKey !== fieldKey);

    if (customRoom.items.length === initialLength) {
      return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in custom room.` });
    }

    await doc.save();

    const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

    // ✅ Correct: updatedRoom is the room you just updated
    const updatedRoom = customRoom;
    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })

    await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });


    return res.status(200).json({
      ok: true,
      message: `Field '${fieldKey}' deleted successfully from custom room.`,
      data: customRoom
    });

  } catch (error) {
    console.error("Error deleting custom room field:", error);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};


const materialSelectionCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const form = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "completed";
    form.isEditable = false
    timerFunctionlity(form, "completedAt")
    await form.save();

    if (form.status === "completed") {
      await generateCostEstimationFromMaterialSelection(form, projectId)


      let uploadedFiles: DocUpload[] = [];

      const extractUploads = (rooms: any[]): DocUpload[] => {
        return rooms.flatMap(room =>
          room.uploads?.map((file: any) => ({
            type: file.type,
            url: file.url,
            originalName: file.originalName,
          })) || []
        );
      };

      uploadedFiles = [
        ...extractUploads(form.rooms),
        ...extractUploads(form.customRooms),
      ];
      await addOrUpdateStageDocumentation({
        projectId,
        stageNumber: "5", // ✅ Put correct stage number here
        description: "Material Selection Stage is documented",
        uploadedFiles, // optionally add files here
      })
    }

    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: form })



    res.status(200).json({ ok: true, message: "Material Selection stage marked as completed", data: form });
    updateProjectCompletionPercentage(projectId);

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

    let room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
    if (!room) {
      room = (materialDoc.customRooms as Types.DocumentArray<any>).id(roomId);
    }

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


    const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

    // ✅ Correct: updatedRoom is the room you just updated
    const updatedRoom = room;
    // await redisClient.set(redisMainKey, JSON.stringify(materialDoc.toObject()), { EX: 60 * 10 })
    await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })


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

    if (!projectId || !roomId || !fileId) {
      return res.status(400).json({ ok: false, message: "Missing required parameters." });
    }

    const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
    if (!materialDoc) {
      return res.status(404).json({ ok: false, message: "Material confirmation document not found." });
    }

    let room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
    if (!room) {
      room = (materialDoc.customRooms as Types.DocumentArray<any>).id(roomId);
    }

    if (!room) {
      return res.status(404).json({ ok: false, message: "Room not found." });
    }

    const initialLength = room.uploads.length;
    room.uploads = room.uploads.filter((upload: any) => upload._id.toString() !== fileId);

    if (room.uploads.length === initialLength) {
      return res.status(404).json({ ok: false, message: "File not found in room." });
    }

    await materialDoc.save();


    const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:room:${roomId}`
    // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

    // ✅ Correct: updatedRoom is the room you just updated
    const updatedRoom = room;
    // await redisClient.set(redisMainKey, JSON.stringify(materialDoc.toObject()), { EX: 60 * 10 })
    await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })

    return res.status(200).json({
      ok: true,
      message: "File deleted successfully.",
    });
  } catch (err) {
    console.error("Delete Room File Error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
};



export {
  getMaterialRoomConfirmationByProject,
  getSinglePredefinedRoom,
  updatePredefinedRoomField,
  createCustomRoom,
  deleteRoom,
  addItemToCustomRoom,
  deleteCustomRoomField,

  materialSelectionCompletionStatus,
  setMaterialConfirmationStageDeadline,
  uploadMaterialRoomFiles,
  deleteMaterialRoomFile
}



