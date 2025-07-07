import { Request, Response } from "express";
import { DailyScheduleModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import { Types } from "mongoose";
import redisClient from "../../../config/redisClient";



const addDailyTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dailyScheduleId, projectId } = req.params;
    const { taskName, date, description, assignedTo } = req.body;

    if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
    }


    console.log("taskName", taskName, date, description, assignedTo)

    if (!taskName) {
      return res.status(400).json({ ok: false, message: "Task name, date, and description are required" });
    }


    if (assignedTo && !Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
    }

    // Handle optional upload
    let upload = undefined;

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

    const newTask = {
      taskName,
      date,
      description,
      status: "not_started",
      upload, // can be undefined if no file uploaded
      assignedTo: assignedTo || null
    };

    const doc = await DailyScheduleModel.findByIdAndUpdate(
      dailyScheduleId,
      { $push: { tasks: newTask } },
      { new: true }
    ).populate({
      path: "tasks.assignedTo",
      select: "_id email workerName"
    });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "DailySchedule not found" });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    res.status(201).json({ ok: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};



const updateDailyTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dailyScheduleId, taskId, projectId } = req.params;
    const { taskName, date, description, status, assignedTo } = req.body;

    if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
    }
    if (!taskId || !Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ ok: false, message: "Valid Task ID is required" });
    }

    if (assignedTo && !Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
    }


    const updateFields: any = {};
    if (taskName) updateFields["tasks.$.taskName"] = taskName;
    if (date) updateFields["tasks.$.date"] = date;
    if (description) updateFields["tasks.$.description"] = description;
    if (status) updateFields["tasks.$.status"] = status;
    if (assignedTo) updateFields["tasks.$.assignedTo"] = assignedTo;


    if (req.file) {
      const { mimetype, location, originalname } = req.file as any;
      if (!mimetype.startsWith("image/")) {
        return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
      }
      updateFields["tasks.$.upload"] = {
        type: "image",
        url: location,
        originalName: originalname,
        uploadedAt: new Date(),
      };
    }

    const doc = await DailyScheduleModel.findOneAndUpdate(
      { _id: dailyScheduleId, "tasks._id": taskId },
      { $set: updateFields },
      { new: true }
    ).populate({
      path: "tasks.assignedTo",
      select: "_id email workerName"
    });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "DailySchedule or Task not found" });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    res.status(200).json({ ok: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteDailyTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dailyScheduleId, taskId, projectId } = req.params;

    if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
    }
    if (!taskId || !Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ ok: false, message: "Valid Task ID is required" });
    }

    const doc = await DailyScheduleModel.findByIdAndUpdate(
      dailyScheduleId,
      { $pull: { tasks: { _id: taskId } } },
      { new: true }
    ).populate({
      path: "tasks.assignedTo",
      select: "_id email workerName"
    });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "DailySchedule or Task not found" });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    res.status(200).json({ ok: true, message: "Task deleted successfully", data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateDailyScheduleStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dailyScheduleId, projectId } = req.params;
    const { status } = req.body;

    if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required." });
    }

    if (!["pending", "submitted", "approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status value." });
    }

    const doc = await DailyScheduleModel.findByIdAndUpdate(
      dailyScheduleId,
      { status },
      { new: true }
    ).populate({
      path: "tasks.assignedTo",
      select: "_id email workerName"
    });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "DailySchedule not found." });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    res.status(200).json({ ok: true, message: "DailySchedule status updated.", data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

export {

  addDailyTask,
  updateDailyTask,
  deleteDailyTask,
  updateDailyScheduleStatus
};
