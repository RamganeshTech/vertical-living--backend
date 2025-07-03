import { Request, Response } from "express";
import mongoose from "mongoose";
import { CleaningAndSanitationModel } from "../../../models/Stage Models/Cleaning Model/cleaning.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { PREDEFINED_ROOMS } from "../../../constants/phaseConstants";
import { syncProjectDelivery } from "../Project Delivery Controllers/projectDelivery.controllers";




export const syncCleaningSanitaionStage = async (projectId: string) => {
  let cleaningDoc = await CleaningAndSanitationModel.findOne({ projectId })

  if (!cleaningDoc) {
    const timer = {
      startedAt: new Date(),
      completedAt: null,
      deadLine: null,
      reminderSent: false,
    };


    await CleaningAndSanitationModel.create({
      projectId,
      isEditable: true,
      status: "pending",
      timer,
      assignedTo: null,
      rooms: PREDEFINED_ROOMS.map(roomName => {
        return {
          roomName,
          uploads: [],
          completelyCleaned: false,
          notes: null
        }
      })
    })
  }else{
    cleaningDoc.timer.startedAt = new Date()
    cleaningDoc.timer.completedAt = null
    cleaningDoc.timer.deadline = null
    cleaningDoc.timer.reminderSent = false
    await cleaningDoc.save()
  }

}

  /**
   * Upload multiple images/pdfs to a specific room
   */
  const uploadCleaningStageFiles = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId, roomId } = req.params;

      if (!projectId || !roomId) {
        return res.status(400).json({ ok: false, message: "Missing projectId or roomId." });
      }

      // Use req.files (multiple) or req.file (single)
      let files = [];

      if (req.files && Array.isArray(req.files)) {
        files = req.files;
      } else if (req.file) {
        files = [req.file];
      } else {
        return res.status(400).json({ ok: false, message: "No files found in request." });
      }

      const uploadedFiles = files.map((file: any) => ({
        type: file.mimetype.includes("pdf") ? "pdf" : "image",
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date(),
      }));

      const updatedDoc = await CleaningAndSanitationModel.findOneAndUpdate(
        {
          projectId,
          "rooms._id": new mongoose.Types.ObjectId(roomId),
        },
        {
          $push: {
            "rooms.$.uploads": { $each: uploadedFiles },
          },
        },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({ ok: false, message: "Room or project not found." });
      }

      return res.json({
        ok: true,
        message: "Files uploaded and saved successfully.",
        data: uploadedFiles,
      });
    } catch (err: any) {
      console.error("Upload Room Files:", err);
      return res.status(500).json({ ok: false, message: err.message });
    }
  };


  /**
   * Delete a single uploaded file by its ID for a room
   */
  const deleteCleaningStageFile = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId, roomId, fileId } = req.params;

      if (!projectId || !roomId || !fileId) {
        return res.status(400).json({ ok: false, message: "Missing projectId, roomId or fileId." });
      }

      const doc = await CleaningAndSanitationModel.findOneAndUpdate(
        {
          projectId,
          "rooms._id": new mongoose.Types.ObjectId(roomId),
        },
        {
          $pull: {
            "rooms.$.uploads": { _id: new mongoose.Types.ObjectId(fileId) },
          },
        },
        { new: true }
      );

      if (!doc) {
        return res.status(404).json({ ok: false, message: "Record not found." });
      }

      return res.json({ ok: true, message: "File deleted successfully." });
    } catch (err: any) {
      console.error("Delete Room File:", err);
      return res.status(500).json({ ok: false, message: err.message });
    }
  };



  const updateCleaningStageRoomNotes = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;
    const { notes } = req.body;

    if (!notes?.trim()) {
      return res.status(400).json({ ok: false, message: "Notes are required." });
    }

    const doc = await CleaningAndSanitationModel.findOneAndUpdate(
      { projectId, "rooms._id": roomId },
      { $set: { "rooms.$.notes": notes } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Room not found." });
    }

    res.json({ ok: true, data: doc });
  } catch (err: any) {
    console.error("Update Room Notes:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

  /**
   * Mark a room as completely cleaned or not
   */
  const updateRoomCleaningStatus = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId, roomId } = req.params;
      const { completelyCleaned } = req.body;

      if (!projectId || !roomId) {
        return res.status(400).json({ ok: false, message: "Missing projectId or roomId." });
      }

      const doc = await CleaningAndSanitationModel.findOneAndUpdate(
        {
          projectId,
          "rooms._id": new mongoose.Types.ObjectId(roomId),
        },
        {
          $set: {
            "rooms.$.completelyCleaned": !!completelyCleaned,
          },
        },
        { new: true }
      );

      if (!doc) {
        return res.status(404).json({ ok: false, message: "Record not found." });
      }

      return res.json({ ok: true, message: "Room cleaning status updated." });
    } catch (err: any) {
      console.error("Update Room Cleaning Status:", err);
      return res.status(500).json({ ok: false, message: err.message });
    }
  };

  /**
   * Get all cleaning & sanitation details for a project
   */
  const getCleaningAndSanitationDetails = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ ok: false, message: "Missing projectId." });
      }

      const doc = await CleaningAndSanitationModel.findOne({ projectId });

      if (!doc) {
        return res.status(404).json({ ok: false, message: "Record not found." });
      }

      return res.json({ ok: true, data: doc });
    } catch (err: any) {
      console.error("Get CleaningAndSanitation Details:", err);
      return res.status(500).json({ ok: false, message: err.message });
    }
  };

  /**
   * Get details for a single room by its ID
   */
  const getSingleCleaningStageRoomDetails = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId, roomId } = req.params;

      if (!projectId || !roomId) {
        return res.status(400).json({ ok: false, message: "Missing projectId or roomId." });
      }

      const doc = await CleaningAndSanitationModel.findOne(
        {
          projectId,
          "rooms._id": new mongoose.Types.ObjectId(roomId),
        },
        {
          "rooms.$": 1,
        }
      );

      if (!doc || !doc.rooms || doc.rooms.length === 0) {
        return res.status(404).json({ ok: false, message: "Room not found." });
      }

      return res.json({ ok: true, data: doc.rooms[0] });
    } catch (err: any) {
      console.error("Get Single Room Details:", err);
      return res.status(500).json({ ok: false, message: err.message });
    }
  };



  // COMMON ROUTES
  export const setCleaningStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
      model: CleaningAndSanitationModel,
      stageName: "Cleaning Sanitation"
    });
  };


  export const cleaningStageCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
      const { projectId } = req.params;
      const form = await CleaningAndSanitationModel.findOne({ projectId });

      if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

      // if(form.status === "completed"){
      //     return res.status(400).json({ ok: false, message: "already set to completed stage" });
      // }

      form.status = "completed";
      form.isEditable = false
      timerFunctionlity(form, "completedAt")
      await form.save();

      // if (form.status === "completed") {
        await syncProjectDelivery(projectId)
      // }

      return res.status(200).json({ ok: true, message: "cleaning and sanitation stage marked as completed", data: form });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
  };


  export {
    uploadCleaningStageFiles,
    deleteCleaningStageFile,
    updateCleaningStageRoomNotes,
    updateRoomCleaningStatus,
    getCleaningAndSanitationDetails,
    getSingleCleaningStageRoomDetails,
  };
