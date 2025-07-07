import { Request, Response } from "express";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { handleSetStageDeadline } from "../../../utils/common features/timerFuncitonality";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { syncRoomsToMaterialConfirmation } from "../../../utils/syncings/syncRoomsWithMaterialConfimation";

import redisClient from './../../../config/redisClient';
import { Model } from "mongoose";
import { syncSampleDesignModel } from "../sampledesign contorllers/sampledesign.controller";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";




const createSiteMeasurement = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params
    const { siteDetails } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "projectId is required" });
    }

    if (!siteDetails || typeof siteDetails !== "object") {
      return res.status(400).json({ ok: false, message: "siteDetails is required and must be an object." });
    }

    const {
      totalPlotAreaSqFt,
      builtUpAreaSqFt,
      roadFacing,
      numberOfFloors,
      hasSlope,
      boundaryWallExists,
      additionalNotes
    } = siteDetails;

    if (totalPlotAreaSqFt !== null && typeof totalPlotAreaSqFt !== "number" && totalPlotAreaSqFt < 0) {
      return res.status(400).json({ ok: false, message: "totalPlotAreaSqFt must be a number or null." });
    }
    if (builtUpAreaSqFt !== null && typeof builtUpAreaSqFt !== "number" && builtUpAreaSqFt < 0) {
      return res.status(400).json({ ok: false, message: "builtUpAreaSqFt must be a number or null." });
    }
    if (roadFacing !== null && typeof roadFacing !== "boolean") {
      return res.status(400).json({ ok: false, message: "roadFacing must be a boolean or null." });
    }
    if (numberOfFloors !== null && typeof numberOfFloors !== "number" && numberOfFloors < 0) {
      return res.status(400).json({ ok: false, message: "numberOfFloors must be a number or null." });
    }
    if (hasSlope !== null && typeof hasSlope !== "boolean") {
      return res.status(400).json({ ok: false, message: "hasSlope must be a boolean or null." });
    }
    if (boundaryWallExists !== null && typeof boundaryWallExists !== "boolean") {
      return res.status(400).json({ ok: false, message: "boundaryWallExists must be a boolean or null." });
    }
    if (additionalNotes !== null && typeof additionalNotes !== "string") {
      return res.status(400).json({ ok: false, message: "additionalNotes must be a string or null." });
    }



    let form = await SiteMeasurementModel.findOne({ projectId });

    if (!form) {
      form = new SiteMeasurementModel({ projectId, siteDetails, rooms: [] });
    } else {
      form.siteDetails = siteDetails;
    }

    await form.save();

    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(form.toObject()), { EX: 60 * 15 });

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: form })


    return res.status(201).json({ ok: true, message: "Site measurement data saved successfully.", data: form });

  } catch (err) {
    console.error("Error saving site measurement form:", err);
    res.status(500).json({ message: "Server error", ok: false });
  }
};

const createRoom = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params
    const { room } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "projectId is required" });
    }

    const { name, length, breadth, height } = room;

    if (name === null || typeof name !== "string" || !name?.trim()) {
      return res.status(400).json({ ok: false, message: `Room name must be a provided` });
    }
    console.log("lenght", length, "height", height, "bredth", breadth)
    if (length === null || typeof length !== "number" || length < 0) {
      return res.status(400).json({ ok: false, message: `Room length must be a number or non-negative number.` });
    }
    if (breadth === null || typeof breadth !== "number" || breadth < 0) {
      return res.status(400).json({ ok: false, message: `Room breadth must be a number or non-negative number.` });
    }
    if (height === null || typeof height !== "number" || height < 0) {
      return res.status(400).json({ ok: false, message: `Room height must be a number or non-negative number.` });
    }

    const existingDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!existingDoc) {
      return res.status(404).json({ ok: false, message: "Site measurement document not found" });
    }

    const duplicateRoom = existingDoc.rooms.find(r => r.name?.toLowerCase() === name?.toLowerCase());
    if (duplicateRoom) {
      return res.status(400).json({ ok: false, message: "A room with this name already exists." });
    }

    // ✅ Safe to push
    existingDoc.rooms.push(room);
    await existingDoc.save();

    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(existingDoc.toObject()), { EX: 60 * 15 });
    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: existingDoc })


    return res.status(201).json({ ok: true, message: "room has created successfully.", data: existingDoc });

  } catch (err) {
    console.error("Error create room  measurement :", err);
    res.status(500).json({ message: "Server error", ok: false });
  }
};


const getTheSiteMeasurements = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "projectId is required" });
    }

    await redisClient.del(`stage:SiteMeasurementModel:${projectId}`)

    const cacheKey = `stage:SiteMeasurementModel:${projectId}`;
    const cachedForm = await redisClient.get(cacheKey);

    if (cachedForm) {
      return res.status(200).json({
        ok: true,
        message: "Site measurement data from cache.",
        data: JSON.parse(cachedForm),
      });
    }

    let form = await SiteMeasurementModel.findOne({ projectId }).populate(assignedTo, selectedFields);

    if (!form) {
      return res.status(400).json({ message: "site measurement not found", ok: false })
    }


    // 3. Cache Mongo data after cache miss
    // await redisClient.set(
    //   cacheKey,
    //   JSON.stringify(form.toObject()), // always store plain object
    //   { EX: 60 * 15 } // 15 min
    // );


    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: form })


    return res.status(200).json({ ok: true, message: "Site measurement fetched successfully.", data: form });
  } catch (err) {
    console.error("Error saving site measurement form:", err);
    res.status(500).json({ message: "Server error", ok: false });
  }
}

// 1. Update Common Site Measurements
const updateCommonSiteMeasurements = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const {
      totalPlotAreaSqFt,
      builtUpAreaSqFt,
      roadFacing,
      numberOfFloors,
      hasSlope,
      boundaryWallExists,
      additionalNotes,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required" });
    }

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) {
      return res.status(404).json({ ok: false, message: "Site measurement not found" });
    }

    if (!siteDoc.isEditable) {
      return res.status(400).json({ ok: false, message: "Site measurement is not editable" });
    }

    if (totalPlotAreaSqFt < 0 || builtUpAreaSqFt < 0 || numberOfFloors < 0) {
      return res.status(400).json({ message: "should not contain negative vlaues", ok: false })
    }

    // Update only allowed fields
    if (totalPlotAreaSqFt !== undefined || totalPlotAreaSqFt !== null) siteDoc.siteDetails.totalPlotAreaSqFt = totalPlotAreaSqFt;
    if (builtUpAreaSqFt !== undefined || builtUpAreaSqFt !== null) siteDoc.siteDetails.builtUpAreaSqFt = builtUpAreaSqFt;
    if (roadFacing !== undefined || roadFacing !== null) siteDoc.siteDetails.roadFacing = roadFacing;
    if (numberOfFloors !== undefined || numberOfFloors !== null) siteDoc.siteDetails.numberOfFloors = numberOfFloors;
    if (hasSlope !== undefined || hasSlope !== null) siteDoc.siteDetails.hasSlope = hasSlope;
    if (boundaryWallExists !== undefined || boundaryWallExists !== null) siteDoc.siteDetails.boundaryWallExists = boundaryWallExists;
    if (additionalNotes !== undefined || additionalNotes !== null) siteDoc.siteDetails.additionalNotes = additionalNotes;

    await siteDoc.save();

    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(siteDoc.toObject()), { EX: 60 * 15 }); // 15min

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })


    return res.status(200).json({ ok: true, message: "Common site details updated successfully", data: siteDoc.siteDetails });
  } catch (err) {
    console.error("Update Common Site Measurement Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

// 2. Update Room Site Measurements
const updateRoomSiteMeasurements = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;
    const { room } = req.body;

    if (!projectId || !roomId) {
      return res.status(400).json({ ok: false, message: "projectId and roomId are required" });
    }

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) {
      return res.status(404).json({ ok: false, message: "Site measurement not found" });
    }

    if (!siteDoc.isEditable) {
      return res.status(400).json({ ok: false, message: "Site measurement is not editable" });
    }

    if (!room.name) {
      return res.status(400).json({ message: `name must be provided`, ok: false })
    }

    if (!room.length || !room.breadth || !room.height) {
      return res.status(400).json({ message: `negative values were not allowed `, ok: false })
    }

    const roomIndex = siteDoc.rooms.findIndex(room => (room as any)._id.toString() === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ message: "Room not found", ok: false });
    }

    const existingRoom = siteDoc.rooms[roomIndex];

    // Update only valid fields
    if (room.name !== undefined) existingRoom.name = room.name;
    if (room.length !== undefined) existingRoom.length = room.length;
    if (room.breadth !== undefined) existingRoom.breadth = room.breadth;
    if (room.height !== undefined) existingRoom.height = room.height;

    await siteDoc.save();

    // await redisClient.set(
    //   `stage:SiteMeasurementModel:${projectId}`,
    //   JSON.stringify(siteDoc.toObject()),
    //   { EX: 60 * 15 })

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })


    return res.status(200).json({ message: "Room updated successfully", data: room, ok: true });
  } catch (err) {
    console.error("Update Room Measurement Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};



// 4. Delete a Room
const DeleteRooms = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;

    if (!projectId || !roomId) return res.status(400).json({ ok: false, message: "projectId and roomId are required" });

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) return res.status(404).json({ ok: false, message: "Site measurement not found" });
    if (!siteDoc.isEditable) return res.status(400).json({ ok: false, message: "Site measurement is not editable" });

    const roomIndex = siteDoc.rooms.findIndex((r: any) => r._id.toString() === roomId);
    if (roomIndex === -1) return res.status(404).json({ ok: false, message: "Room not found" });

    let cacheRoom = siteDoc.rooms[roomIndex]
    siteDoc.rooms.splice(roomIndex, 1);
    await siteDoc.save();

    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(siteDoc.toObject()), { EX: 60 * 15 })

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })


    return res.status(200).json({ message: "Room deleted successfully", data: siteDoc.rooms, ok: true });
  } catch (err) {
    console.error("Delete Room Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};


const deleteSiteMeasurement = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "projectId are required" });

    const siteDoc = await SiteMeasurementModel.findOneAndUpdate({ projectId }, {
      status: "pending",
      isEditable: true,
      timer: {
        startedAt: new Date(),
        deadLine: null,
        completedAt: null,
        reminderSent: false
      },
      uploads: [],
      siteDetails: {
        totalPlotAreaSqFt: null,
        builtUpAreaSqFt: null,
        roadFacing: null,
        numberOfFloors: null,
        hasSlope: null,
        boundaryWallExists: null,
        additionalNotes: null
      },
      rooms: [],
    }, { returnDocument: "after" });

    if (!siteDoc) return res.status(404).json({ ok: false, message: "Site measurement not found" });

    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(siteDoc.toObject()), { EX: 60 * 15 }); // 15min

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })



    return res.status(200).json({ message: "Site details deleted adn timer restarted successfully", data: siteDoc, ok: true });
  } catch (err) {
    console.error("Delete site Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
}


// COMMON API
export const setSiteMeasurementStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: SiteMeasurementModel,
    stageName: "Site Measurement"
  });
};


const siteMeasurementCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) return res.status(404).json({ ok: false, message: "Site measurement not found" });

    // if (siteDoc.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

    siteDoc.status = "completed";
    siteDoc.isEditable = false;

    // if (siteDoc.status === "completed") {
    const siteRooms = siteDoc.rooms || [];
    await syncSampleDesignModel(projectId, siteRooms)
    // await syncRoomsToMaterialConfirmation(projectId, siteRooms)
    // }

    await siteDoc.save();

    // await updateStageStatusInCache(SiteMeasurementModel, projectId, "completed");
    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(siteDoc.toObject()), { EX: 60 * 10 }); // 15min

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })


    return res.status(200).json({ ok: true, message: "Site measurement marked as completed", data: siteDoc });
  } catch (err) {
    console.error("Site Measurement Complete Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};


const deleteSiteMeasurementFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, fileId } = req.params;

    const doc = await SiteMeasurementModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "Site measurement not found" });

    // const file = doc.uploads.find((file: any) => file._id.toString() === fileId);

    const index = doc.uploads.findIndex((upload: any) => upload._id?.toString() === fileId);

    console.log("index for file ", index)

    if (index === -1) return res.status(404).json({ ok: false, message: "File not found" });

    doc.uploads.splice(index, 1);
    await doc.save();
    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(doc.toObject()), { EX: 60 * 10 }); // 15min

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: doc })


    return res.status(200).json({ ok: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting uploaded file:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};




export {
  createSiteMeasurement,
  createRoom,
  getTheSiteMeasurements,
  updateCommonSiteMeasurements,
  updateRoomSiteMeasurements,
  siteMeasurementCompletionStatus,
  DeleteRooms,
  deleteSiteMeasurement,


  deleteSiteMeasurementFile,
}