import { Request, Response } from "express";
import { RequirementFormModel } from "../../models/Stage Models/requirment model/requirement.model";
import { SiteMeasurementModel } from "../../models/Stage Models/siteMeasurement models/siteMeasurement.model";

const createSiteMeasurement = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params
    const {
      siteDetails,
      rooms
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "projectId is required" });
    }

    const requirementForm = await RequirementFormModel.findOne({ projectId });
    if (!requirementForm || requirementForm.status !== "completed") {
      return res.status(400).json({ ok: false, message: "Requirement stage must be completed first." });
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

    if (!Array.isArray(rooms)) {
      return res.status(400).json({ ok: false, message: "rooms must be an array." });
    }

    for (const [index, room] of rooms.entries()) {
      if (!room || typeof room !== "object") {
        return res.status(400).json({ ok: false, message: `Room at index ${index} is invalid.` });
      }

      const { name, length, breadth, height } = room;

      if (name !== null && typeof name !== "string") {
        return res.status(400).json({ ok: false, message: `Room name at index ${index} must be a string or null.` });
      }
      if (length !== null && typeof length !== "number" && length < 0) {
        return res.status(400).json({ ok: false, message: `Room length at index ${index} must be a number or null.` });
      }
      if (breadth !== null && typeof breadth !== "number" && breadth < 0) {
        return res.status(400).json({ ok: false, message: `Room breadth at index ${index} must be a number or null.` });
      }
      if (height !== null && typeof height !== "number" && height < 0) {
        return res.status(400).json({ ok: false, message: `Room height at index ${index} must be a number or null.` });
      }
    }

    let form = await SiteMeasurementModel.findOne({ projectId });

    if (!form) {
      form = new SiteMeasurementModel({ projectId, siteDetails, rooms });
    } else {
      form.siteDetails = siteDetails;
      form.rooms = rooms;
    }

    await form.save();

    return res.status(201).json({ ok: true, message: "Site measurement data saved successfully.", data: form });

  } catch (err) {
    console.error("Error saving site measurement form:", err);
    res.status(500).json({ message: "Server error", ok: false });
  }
};





const getTheSiteMeasurements = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "projectId is required" });
    }

    let form = await SiteMeasurementModel.findOne({ projectId });

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
      return res.status(403).json({ ok: false, message: "Site measurement is not editable" });
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
    const { name, length, breadth, height } = req.body;

    if (!projectId || !roomId) {
      return res.status(400).json({ ok: false, message: "projectId and roomId are required" });
    }

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) {
      return res.status(404).json({ ok: false, message: "Site measurement not found" });
    }

    if (!siteDoc.isEditable) {
      return res.status(403).json({ ok: false, message: "Site measurement is not editable" });
    }

    if (!length || !breadth || !height) {
      return res.status(400).json({ message: `negative values were not allowed `, ok: false })
    }

    const roomIndex = siteDoc.rooms.findIndex(room => (room as any)._id.toString() === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ message: "Room not found", ok: false });
    }

    const room = siteDoc.rooms[roomIndex];

    // Update only valid fields
    if (name !== undefined) room.name = name;
    if (length !== undefined) room.length = length;
    if (breadth !== undefined) room.breadth = breadth;
    if (height !== undefined) room.height = height;

    await siteDoc.save();

    return res.status(200).json({ message: "Room updated successfully", data: room, ok: true });
  } catch (err) {
    console.error("Update Room Measurement Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

// 3. Complete the Site Measurement
const siteMeasurementCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

    const siteDoc = await SiteMeasurementModel.findOne({ projectId });
    if (!siteDoc) return res.status(404).json({ ok: false, message: "Site measurement not found" });

    if (!siteDoc.isEditable) return res.status(403).json({ ok: false, message: "Already completed" });

    siteDoc.status = "completed";
    siteDoc.isEditable = false;

    await siteDoc.save();
    return res.status(200).json({ ok: true, message: "Site measurement marked as completed", data: siteDoc });
  } catch (err) {
    console.error("Site Measurement Complete Error:", err);
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
    if (!siteDoc.isEditable) return res.status(403).json({ ok: false, message: "Site measurement is not editable" });

    const roomIndex = siteDoc.rooms.findIndex((r: any) => r._id.toString() === roomId);
    if (roomIndex === -1) return res.status(404).json({ ok: false, message: "Room not found" });

    siteDoc.rooms.splice(roomIndex, 1);
    await siteDoc.save();

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
      status:"pending",
      isEditable:true,
      timer:{
        startedAt: new Date(),
      },
      uploads:[],
      siteInformation: {
        totalPlotAreaSqFt: null,
        builtUpAreaSqFt: null,
        roadFacing: null,
        numberOfFloors: null,
        hasSlope: null,
        boundaryWallExists: null,
        additionalNotes: null
      },
      rooms: [],
    });

    if (!siteDoc) return res.status(404).json({ ok: false, message: "Site measurement not found" });



    return res.status(200).json({ message: "Site details deleted successfully", data: siteDoc, ok: true });
  } catch (err) {
    console.error("Delete site Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
}


export {
  createSiteMeasurement,
  getTheSiteMeasurements,
  updateCommonSiteMeasurements,
  updateRoomSiteMeasurements,
  siteMeasurementCompletionStatus,
  DeleteRooms,

  deleteSiteMeasurement
}