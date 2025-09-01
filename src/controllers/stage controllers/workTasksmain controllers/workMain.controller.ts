import { Request, Response } from "express";
import { WorkScheduleModel } from "../../../models/Stage Models/WorkTask Model/workSchedule.model";
import { DailyScheduleModel, DailyTaskSubModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import { Types } from "mongoose";
import WorkMainStageScheduleModel from './../../../models/Stage Models/WorkTask Model/WorkTask.model';
import { WorkerModel } from "../../../models/worker model/worker.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { syncInstallationWork } from "../installation controllers/installation.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";



export const syncWorkSchedule = async (projectId: string) => {
  const docs = await WorkMainStageScheduleModel.findOne({ projectId });

  if (!docs) {
    console.log("im gettin involde the if part")

    let workModel = new WorkMainStageScheduleModel({
      projectId,
      status: "pending",
      dailyScheduleId: null,
      workScheduleId: null,
      assignedTo: null,
      mdApproval: {
        status: "pending",
        remarks: ""
      },
      timer: {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false
      },
      isEditable: false
    })

    await workModel.save()

    // let dailySchedule = new DailyScheduleModel({
    //   projectId,
    //   stageId: workModel._id,
    //   tasks: [],
    //   status: "pending",
    //   remarks: ""
    // })

    // let workSchedule = new WorkScheduleModel({
    //   projectId,
    //   stageId: workModel._id,
    //   plans: [],
    //   status: "pending",
    //   remarks: ""
    // })


   



    // await dailySchedule.save()
    // await workSchedule.save()

    // workModel.dailyScheduleId = dailySchedule._id as Types.ObjectId
    // workModel.workScheduleId = workSchedule._id as Types.ObjectId


     await DailyScheduleModel.create({
      projectId,
      tasks:[]
    })

    await workModel.save()
  }
  else {
    console.log("im gettin involde the else part")
    docs.timer.startedAt = new Date()
    docs.timer.completedAt = null
    docs.timer.deadLine = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      docs.timer.reminderSent = false


    docs.save()
  }
  await redisClient.del(`stage:WorkMainStageScheduleModel:${projectId}`)
}

const getAllWorkMainStageDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required" });
    }
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid Project ID" });
    }


    const redisMainKey = `stage:WorkMainStageScheduleModel:${projectId}`

    const cachedData = await redisClient.get(redisMainKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }


    const docs = await WorkMainStageScheduleModel.findOne({ projectId });

    if (!docs) {
      return res.status(404).json({ ok: false, message: "work Main stage not found" });
    }

    // await redisClient.set(redisMainKey, JSON.stringify(docs.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: WorkMainStageScheduleModel, projectId, dataToCache: docs })

    res.status(200).json({ ok: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const getAllWorkSchedules = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required" });
    }
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid Project ID" });
    }

    const redisWorkScheduleKey = `stage:WorkScheduleModel:${projectId}`
    // await redisClient.del(redisWorkScheduleKey)

    const cachedData = await redisClient.get(redisWorkScheduleKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }

    const docs = await WorkScheduleModel.findOne({ projectId })
      .populate({
        path: "plans.assignedTo",
        select: "_id email workerName"
      });;

    if (!docs) {
      return res.status(404).json({ ok: false, message: "work Schedule stage not found" });
    }

    await redisClient.set(redisWorkScheduleKey, JSON.stringify(docs.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


const getAllDailySchedules = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required" });
    }
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid Project ID" });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.del(redisDailyScheduleKey)

    const cachedData = await redisClient.get(redisDailyScheduleKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }

    // const docs = await DailyScheduleModel.findOne({ projectId })
    //   .populate({
    //     path: "tasks.assignedTo",
    //     select: "_id email workerName"
    //   });


    const docs = await DailyTaskSubModel.find({ projectId })
     .populate({
    path: "projectAssignee.carpenterName",
    select: "_id email workerName" // adjust fields as needed
  });

    if (!docs) {
      return res.status(404).json({ ok: true, data:[], message: "work Schedule stage not found" });
    }


    await redisClient.set(redisDailyScheduleKey, JSON.stringify(docs), { EX: 60 * 10 })


    res.status(200).json({ ok: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


// GET all daily tasks for a specific schedule

const mdApprovalAction = async (req: Request, res: Response): Promise<any> => {
  try {
    const { mainStageId, projectId } = req.params;
    const { action, remarks } = req.body;

    if (!mainStageId || !Types.ObjectId.isValid(mainStageId)) {
      return res.status(400).json({ ok: false, message: "Valid Main Stage ID is required." });
    }

    if (!["pending", "approved", "rejected"].includes(action)) {
      return res.status(400).json({ ok: false, message: "Action must be 'approved' or 'rejected' or 'pending'" });
    }

    const mainStage = await WorkMainStageScheduleModel.findById(mainStageId);
    if (!mainStage) {
      return res.status(404).json({ ok: false, message: "Main stage not found." });
    }

    // Check sub-model statuses:
    const daily = await DailyScheduleModel.findById(mainStage.dailyScheduleId);
    const work = await WorkScheduleModel.findById(mainStage.workScheduleId);

    if (!daily || !work) {
      return res.status(404).json({ ok: false, message: "DailySchedule or WorkSchedule not found." });
    }

    // if (daily.status !== "completed" || work.status !== "completed") {
    //   return res.status(400).json({ ok: false, message: "Cannot approve/reject. Sub stages are not completed yet." });
    // }

    if (action === "approved") {
      // ✅ Approve: update mdApproval & main stage status
      mainStage.mdApproval.status = "approved";
      mainStage.mdApproval.remarks = remarks || "";
    } else if (action === "rejected") {
      // ✅ Reject: update mdApproval & reset sub-models
      mainStage.mdApproval.status = "rejected";
      mainStage.mdApproval.remarks = remarks || "";

      // Reset sub-model statuses to pending
      // daily.status = "pending";
      work.status = "pending";

      await daily.save();
      await work.save();

    }

    await mainStage.save();

    // const redisMainKey = `stage:WorkMainStageScheduleModel:${mainStage.projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(mainStage.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: WorkMainStageScheduleModel, projectId, dataToCache: mainStage })


    const redisWorkScheduleKey = `stage:WorkScheduleModel:${mainStage.projectId}`
    const redisDailyScheduleKey = `stage:DailyScheduleModel:${mainStage.projectId}`

    await redisClient.set(redisDailyScheduleKey, JSON.stringify(daily.toObject()), { EX: 60 * 10 })
    await redisClient.set(redisWorkScheduleKey, JSON.stringify(work.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, message: `MD has ${action} the stage.`, data: mainStage });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


const getProjectWorkers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Valid Project ID is required" });
    }

    const redisGetWorker = `stage:WorkMainStageScheduleModel:${projectId}:getworkers`


    const workers = await WorkerModel.find({ projectId: projectId }).select("_id workerName email");

    await redisClient.set(redisGetWorker, JSON.stringify(workers), { EX: 60 * 10 })

    res.status(200).json({ ok: true, data: workers });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


// COMMON STAGE CONTROLLERS

const setWorkScheduleStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: WorkMainStageScheduleModel,
    stageName: "Work Schedule"
  });
};



const workScheduleCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const form = await WorkMainStageScheduleModel.findOne({ projectId });


    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    // if(form.mdApproval.status !== "approved"){
    //   return res.status(400).json({message:"MD has not approved yet, please update MD approval as approved" , ok:false})
    // }

    form.status = "completed";
    form.isEditable = false
    timerFunctionlity(form, "completedAt")
    await form.save();

    if (form.status = "completed") {
      await syncInstallationWork(projectId)
    }

    // const redisMainKey = `stage:WorkMainStageScheduleModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: WorkMainStageScheduleModel, projectId, dataToCache: form })


    res.status(200).json({ ok: true, message: "work stage marked as completed", data: form });

    updateProjectCompletionPercentage(projectId);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};

export {
  getAllWorkMainStageDetails,
  getAllWorkSchedules,
  getAllDailySchedules,
  mdApprovalAction,
  getProjectWorkers,

  setWorkScheduleStageDeadline,
  workScheduleCompletionStatus
}