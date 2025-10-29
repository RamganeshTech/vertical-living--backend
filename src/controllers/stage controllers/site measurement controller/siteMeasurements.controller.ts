import { Request, Response } from "express";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { handleSetStageDeadline } from "../../../utils/common features/timerFuncitonality";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
// import { syncRoomsToMaterialConfirmation } from "../../../utils/syncings/syncRoomsWithMaterialConfimation";
import { Types } from "mongoose";

import redisClient from './../../../config/redisClient';
import { Model } from "mongoose";
import { syncSampleDesignModel } from "../sampledesign contorllers/sampledesign.controller";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { initializeSiteRequirement } from "../../../utils/Stage Utils/siteRequirementsInitialize";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { DocUpload, RoleBasedRequest } from "../../../types/types";
// import { syncShortList } from "../sampledesign contorllers/shortList.controller";
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";


export const syncSiteMeasurement = async (projectId: string, rooms: any) => {

  let siteMeasurement = await SiteMeasurementModel.findOne({ projectId });

  if (!siteMeasurement) {
    siteMeasurement = new SiteMeasurementModel({
      projectId: projectId,
      status: "pending",
      assignedTo: null,
      isEditable: true,
      timer: {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
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
      rooms: rooms.map((room: any) => {
        return {
          name: room.roomName,
          height: null,
          breadth: null,
          length: null,
          uploads: []
        }
      }),
    });
  } else {
    siteMeasurement.status = "pending";
    siteMeasurement.isEditable = true;
    siteMeasurement.timer.startedAt = new Date();
    siteMeasurement.timer.reminderSent = false
    siteMeasurement.timer.completedAt = null
    siteMeasurement.timer.deadLine = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    const existingRoomNames = siteMeasurement?.rooms.map((room: any) => room.name);

    // Create only missing rooms
    const newRooms = rooms
      .filter((room: any) => !existingRoomNames.includes(room.roomName))
      .map((room: any) => ({
        name: room.roomName,
        length: null,
        breadth: null,
        height: null,
        uploads: [],
      }));

    // Append missing rooms while keeping existing rooms intact
    siteMeasurement.rooms = [...siteMeasurement.rooms, ...newRooms];
  }
  await siteMeasurement.save()

  // await populateWithAssignedToField({stageModel:SiteMeasurementModel, dataToCache:siteMeasurement, projectId})
  const redisMainKey = `stage:SiteMeasurementModel:${projectId}`
  await redisClient.del(redisMainKey)

}

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

    if (totalPlotAreaSqFt && totalPlotAreaSqFt < 0) {
      return res.status(400).json({ ok: false, message: "totalPlotAreaSqFt must be a number or null." });
    }
    if (builtUpAreaSqFt && builtUpAreaSqFt < 0) {
      return res.status(400).json({ ok: false, message: "builtUpAreaSqFt must be a number or null." });
    }

    if (numberOfFloors && numberOfFloors < 0) {
      return res.status(400).json({ ok: false, message: "numberOfFloors must be a number or null." });
    }

    if (additionalNotes && typeof additionalNotes !== "string") {
      return res.status(400).json({ ok: false, message: "additionalNotes must be a string or null." });
    }



    let form = await SiteMeasurementModel.findOne({ projectId });

    if (!form) {
      form = new SiteMeasurementModel({ projectId, siteDetails, rooms: initializeSiteRequirement });
    } else {

      if (siteDetails) {
        siteDetails.totalPlotAreaSqFt = totalPlotAreaSqFt || 0,
          siteDetails.builtUpAreaSqFt = builtUpAreaSqFt || 0,
          siteDetails.roadFacing = roadFacing,
          siteDetails.numberOfFloors = numberOfFloors || 0,
          siteDetails.hasSlope = hasSlope,
          siteDetails.boundaryWallExists = boundaryWallExists,
          siteDetails.additionalNotes = additionalNotes || ""
      }
      // console.log("gettiing isndeht esit3crete else condiiton")
      form.siteDetails = siteDetails;
      // form.rooms = initializeSiteRequirement
      // form.set('rooms', initializeSiteRequirement);
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
    // console.log("lenght", length, "height", height, "bredth", breadth)
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



    // await syncOrderingMaterialsHistory(projectId)

    // await redisClient.del(`stage:SiteMeasurementModel:${projectId}`)



    // const forme = await SiteMeasurementModel.findOne({ projectId: "6878a3782bdbe069a1a71920" });

    // if (!forme) {
    //   console.log("Project not found");
    //   return;
    // }

    // console.log("form ", forme)
    // let updated = false;

    // forme.rooms = forme.rooms.map((room:any) => {
    //   console.log("single room", room)
    //   if (!("uploads" in room)) {
    //     updated = true;
    //     return {
    //       ...room.toObject(), // convert Mongoose subdocument to plain object
    //       uploads: []
    //     };
    //   }
    //   return room;
    // });

    // if (updated) {
    //   forme.markModified('rooms');
    //   await forme.save();
    //   console.log("Rooms updated with uploads field.");
    // } else {
    //   console.log("All rooms already have uploads field.");
    // }


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

    // if (!siteDoc.isEditable) {
    //   return res.status(400).json({ ok: false, message: "Site measurement is not editable" });
    // }

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

    // console.log("siteDocc", siteDoc)

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

    // if (!siteDoc.isEditable) {
    //   return res.status(400).json({ ok: false, message: "Site measurement is not editable" });
    // }

    if (!room?.name?.trim()) {
      return res.status(400).json({ message: `name must be provided`, ok: false })
    }

     if (room?.length === null || typeof room?.length !== "number" || room?.length < 0) {
      return res.status(400).json({ ok: false, message: `Room length must be a number or non-negative number.` });
    }
    if (room?.breadth === null || typeof room?.breadth !== "number" || room?.breadth < 0) {
      return res.status(400).json({ ok: false, message: `Room breadth must be a number or non-negative number.` });
    }
    if (room?.height === null || typeof room?.height !== "number" || room?.height < 0) {
      return res.status(400).json({ ok: false, message: `Room height must be a number or non-negative number.` });
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
    // if (!siteDoc.isEditable) return res.status(400).json({ ok: false, message: "Site measurement is not editable" });

    const roomIndex = siteDoc.rooms.findIndex((r: any) => r._id.toString() === roomId);
    if (roomIndex === -1) return res.status(404).json({ ok: false, message: "Room not found" });

    // let cacheRoom = siteDoc.rooms[roomIndex]
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



    return res.status(200).json({ message: "Site details resetted and timer restarted successfully", data: siteDoc, ok: true });
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

    if (siteDoc.status === "completed") return res.status(400).json({ ok: false, message: "Stage Already completed" });

    siteDoc.status = "completed";
    siteDoc.isEditable = false;

    if (siteDoc.status === "completed") {
      const siteRooms = siteDoc.rooms || [];
      await syncSampleDesignModel(projectId, siteRooms)

      // const uploadedFiles: DocUpload[] = siteDoc.uploads.map((upload) => ({ type: upload.type, originalName: upload.originalName, url: upload.url }))
      // await addOrUpdateStageDocumentation({
      //   projectId,
      //   stageNumber: "2", // ✅ Put correct stage number here
      //   description: "Site Measurement Stage marked is documented",
      //   uploadedFiles, // optionally add files here
      // })
    }

    await siteDoc.save();

    // await updateStageStatusInCache(SiteMeasurementModel, projectId, "completed");
    // await redisClient.set(`stage:SiteMeasurementModel:${projectId}`, JSON.stringify(siteDoc.toObject()), { EX: 60 * 10 }); // 15min

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: siteDoc })


    res.status(200).json({ ok: true, message: "Site measurement marked as completed", data: siteDoc });
    updateProjectCompletionPercentage(projectId);

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




const uploadSiteMeasurementRoomImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files?.length) {
      return res.status(400).json({ message: "No files uploaded", ok: false });
    }

    // Allow only image files
    const imageFiles = files.filter(file => file.mimetype.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      return res.status(400).json({ message: "Only image files are allowed", ok: false });
    }



    const doc = await SiteMeasurementModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ message: "Stage not found", ok: false });
    }

    const room = (doc.rooms as any).id(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found", ok: false });
    }


    let uploadedLength = room?.uploads?.length || 0
    const uploads = imageFiles.map((file,) => {
      uploadedLength += 1
      return {
        _id: new Types.ObjectId(),
        type: "image",
        url: (file as any).location,
        originalName: file.originalname,
        categoryName: `general-${uploadedLength}`,
        uploadedAt: new Date(),
      }
    }
    );

    // Ensure uploads array exists
    if (!room?.uploads) {
      room.uploads = [];
    }

    // Add new uploads
    room.uploads.push(...uploads);

    await doc.save();

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: doc })


    res.status(200).json({ message: "Images uploaded successfully", data: uploads, ok: true });
    return
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Internal server error", ok: false });
    return
  }
};





const deleteSiteMeasurementRoomImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, uploadId } = req.params;

    const updated = await SiteMeasurementModel.findOneAndUpdate(
      {
        projectId: projectId,
        "rooms._id": roomId,
      },
      {
        $pull: {
          "rooms.$.uploads": { _id: uploadId }
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Project or room not found", ok: false });
    }

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: updated })

    res.status(200).json({ message: "Image deleted successfully", ok: true });
    return
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error", ok: false });
    return
  }
};


const updateRoomImageName = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {

    const { projectId, roomId, uploadId } = req.params
    const { categoryName } = req.body;

    if (!projectId || !roomId || !uploadId) {
      return res.status(400).json({ message: "Missing required fields", ok: false });
    }


    if (!categoryName.trim()) {
      return res.status(400).json({ message: "Missing required fields", ok: false });

    }

    const measurement = await SiteMeasurementModel.findOne({ projectId });

    if (!measurement) {
      return res.status(404).json({ message: "Project not found", ok: false });
    }

    const room = (measurement.rooms as any).id(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found", ok: false });
    }

    const upload = room.uploads.id(uploadId);

    if (!upload) {
      return res.status(404).json({ message: "Upload not found", ok: false });
    }

    // Set categoryName (adds it even if previously missing)
    upload.categoryName = categoryName;

    await measurement.save();


    // const shortlisting = await ShortlistedDesignModel.findOne({ projectId })

    // if (shortlisting) {
    //   if (shortlisting?.shortlistedRooms?.length) {
    //     const isRooomAvailble = shortlisting.shortlistedRooms.find(shortlistroom => {
    //       console.log("room form site", room.name)
    //       console.log("shortlisign roomName", shortlistroom.roomName)

    //       return shortlistroom.roomName === room.name
    //     })
    //     // console.log("isRoomAvailabel", isRooomAvailble)

    //     if (isRooomAvailble) {
    //       const isCategoryAvailable = isRooomAvailble.categories.find(category => {
    //         console.log("category availen in shorit", category.categoryId)
    //         console.log("category availen in site upload", uploadId)
    //         return category.categoryId === uploadId
    //       })

    //       // console.log("isCategoryAvailable", isCategoryAvailable)


    //       if (isCategoryAvailable) {
    //         isCategoryAvailable.categoryName = categoryName
    //         await shortlisting.save()
    //       }
    //     }
    //   }
    // }

    await populateWithAssignedToField({ stageModel: SiteMeasurementModel, projectId, dataToCache: measurement })


    return res.status(200).json({
      message: "Category name updated successfully",
      data: upload,
      ok: true
    });
  } catch (error) {
    console.error("Error updating category name:", error);
    return res.status(500).json({ message: "Server error", ok: false });
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

  uploadSiteMeasurementRoomImages,
  deleteSiteMeasurementRoomImage,
  updateRoomImageName

}