import { Request, Response } from "express";
import { WorkScheduleModel } from "../../../models/Stage Models/WorkTask Model/workSchedule.model";
import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import { Types } from "mongoose";
import redisClient from "../../../config/redisClient";


const addWorkPlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const { workScheduleId, projectId } = req.params;
    const { workType, startDate, endDate, assignedTo, notes } = req.body;

    if (!workScheduleId || !Types.ObjectId.isValid(workScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid WorkSchedule ID is required" });
    }

    if (!workType) {
      return res.status(400).json({ ok: false, message: "WorkType are required" });
    }

    if (assignedTo) {
      if (!Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
      }
    }

    // Optional upload
    let upload = null;

    if (req.file) {
      const { mimetype, location, originalname } = req.file as any;

      if (!mimetype.startsWith("image/")) {
        return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
      }

      upload = {
        type: "image",
        url: location,
        originalName: originalname,
        uploadedAt: new Date(),
      };
    }

    const newPlan = {
      workType,
      startDate,
      endDate,
      assignedTo: assignedTo || null,
      notes,
      upload,
    };

    const doc = await WorkScheduleModel.findByIdAndUpdate(
      workScheduleId,
      { $push: { plans: newPlan } },
      { new: true }
    ).populate({
        path: "plans.assignedTo",
        select: "_id email workerName"
      });;


    if (!doc) {
      return res.status(404).json({ ok: false, message: "WorkSchedule not found" });
    }


    const redisWorkScheduleKey = `stage:WorkScheduleModel:${projectId}`
    await redisClient.set(redisWorkScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    res.status(201).json({ ok: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateWorkPlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const { workScheduleId, planId, projectId } = req.params;
    const { workType, startDate, endDate, assignedTo, notes } = req.body;

    if (!workScheduleId || !Types.ObjectId.isValid(workScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid WorkSchedule ID is required" });
    }
    if (!planId || !Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ ok: false, message: "Valid Plan ID is required" });
    }

    if (assignedTo) {
      if (!Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
      }
    }

    const updateFields: any = {};
    if (workType) updateFields["plans.$.workType"] = workType;
    if (startDate) updateFields["plans.$.startDate"] = startDate;
    if (endDate) updateFields["plans.$.endDate"] = endDate;
    if (assignedTo) updateFields["plans.$.assignedTo"] = assignedTo;
    if (notes) updateFields["plans.$.notes"] = notes;

    if (req.file) {
      const { mimetype, location, originalname } = req.file as any;
      if (!mimetype.startsWith("image/")) {
        return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
      }
      updateFields["plans.$.upload"] = {
        type: "image",
        url: location,
        originalName: originalname,
        uploadedAt: new Date(),
      };
    }

    const doc = await WorkScheduleModel.findOneAndUpdate(
      { _id: workScheduleId, "plans._id": planId },
      { $set: updateFields },
      { new: true }
    ).populate({
        path: "plans.assignedTo",
        select: "_id email workerName"
      });;
;

    if (!doc) {
      return res.status(404).json({ ok: false, message: "WorkSchedule or Plan not found" });
    }

    const redisWorkScheduleKey = `stage:WorkScheduleModel:${projectId}`
    await redisClient.set(redisWorkScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};



const deleteWorkPlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const { workScheduleId, planId, projectId } = req.params;

    if (!workScheduleId || !Types.ObjectId.isValid(workScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid WorkSchedule ID is required" });
    }
    if (!planId || !Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ ok: false, message: "Valid Plan ID is required" });
    }

    const doc = await WorkScheduleModel.findByIdAndUpdate(
      workScheduleId,
      { $pull: { plans: { _id: planId } } },
      { new: true }
    ).populate({
        path: "plans.assignedTo",
        select: "_id email workerName"
      });;


    if (!doc) {
      return res.status(404).json({ ok: false, message: "WorkSchedule or Plan not found" });
    }

    const redisWorkScheduleKey = `stage:WorkScheduleModel:${projectId}`
    await redisClient.set(redisWorkScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, message: "Plan deleted successfully", data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateWorkScheduleStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { workScheduleId, projectId } = req.params;
    const { status } = req.body;

    if (!workScheduleId || !Types.ObjectId.isValid(workScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid WorkSchedule ID is required." });
    }

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status value." });
    }

    const doc = await WorkScheduleModel.findByIdAndUpdate(
      workScheduleId,
      { status },
      { new: true }
    ).populate({
        path: "plans.assignedTo",
        select: "_id email workerName"
      });;


    if (!doc) {
      return res.status(404).json({ ok: false, message: "WorkSchedule not found." });
    }

    const redisWorkScheduleKey = `stage:WorkScheduleModel:${projectId}`
    await redisClient.set(redisWorkScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, message: "WorkSchedule status updated.", data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

export {
  addWorkPlan,
  updateWorkPlan,
  deleteWorkPlan,
  updateWorkScheduleStatus
};
