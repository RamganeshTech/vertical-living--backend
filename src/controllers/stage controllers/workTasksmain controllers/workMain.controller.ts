import { Request, Response } from "express";
import { WorkScheduleModel } from "../../../models/Stage Models/WorkTask Model/workSchedule.model";
import { DailyScheduleModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import { Types } from "mongoose";
import WorkMainStageScheduleModel from './../../../models/Stage Models/WorkTask Model/WorkTask.model';
import { WorkerModel } from "../../../models/worker model/worker.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";



export const syncWorkSchedule = async (projectId: string) => {
  const docs = await WorkMainStageScheduleModel.findOne({ projectId });

  if (!docs) {
    console.log("im gettin involde the if part")

    let workModel = new WorkMainStageScheduleModel({
      projectId,
      status: "pending",
      dailyScheduleId: null,
      workScheduleId: null,
      mdApproval: {
        status: "pending",
        remarks: ""
      },
      timer: {
        startedAt: new Date(),
        completedAt: null,
        deadLine: null,
        reminderSent: false
      },
      isEditable: false
    })

    await workModel.save()

   let dailySchedule =  new DailyScheduleModel({
      projectId,
      stageId: workModel._id,
      tasks: [],
      status: "pending",
      remarks: ""
    })

    let workSchedule = new WorkScheduleModel({
      projectId,
      stageId: workModel._id,
      plans: [],
      status: "pending",
      remarks: ""
    })

    await dailySchedule.save()
    await workSchedule.save()
    
    workModel.dailyScheduleId = dailySchedule._id as Types.ObjectId
    workModel.workScheduleId = workSchedule._id as Types.ObjectId

    await workModel.save()
  }
  else{
    console.log("im gettin involde the else part")
    docs.timer.startedAt = new Date()
    docs.timer.completedAt = null
    docs.timer.deadLine = null
    docs.timer.reminderSent = false
  }

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

    const docs = await WorkMainStageScheduleModel.findOne({ projectId });

    if (!docs) {
      return res.status(404).json({ ok: false, message: "work Main stage not found" });
    }

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

    const docs = await WorkScheduleModel.findOne({ projectId });

    if (!docs) {
      return res.status(404).json({ ok: false, message: "work Schedule stage not found" });
    }

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

    const docs = await DailyScheduleModel.findOne({ projectId });

    if (!docs) {
      return res.status(404).json({ ok: false, message: "work Schedule stage not found" });
    }

    res.status(200).json({ ok: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};



const mdApprovalAction = async (req: Request, res: Response): Promise<any> => {
  try {
    const { mainStageId } = req.params;
    const { action, remarks } = req.body;

    if (!mainStageId || !Types.ObjectId.isValid(mainStageId)) {
      return res.status(400).json({ ok: false, message: "Valid Main Stage ID is required." });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ ok: false, message: "Action must be 'approved' or 'rejected'." });
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

    if (daily.status !== "completed" || work.status !== "completed") {
      return res.status(400).json({ ok: false, message: "Cannot approve/reject. Sub stages are not completed yet." });
    }

    if (action === "approved") {
      // ✅ Approve: update mdApproval & main stage status
      mainStage.mdApproval.status = "approved";
      mainStage.mdApproval.remarks = remarks || "";
    } else if (action === "rejected") {
      // ✅ Reject: update mdApproval & reset sub-models
      mainStage.mdApproval.status = "rejected";
      mainStage.mdApproval.remarks = remarks || "";

      // Reset sub-model statuses to pending
      daily.status = "pending";
      work.status = "pending";

      await daily.save();
      await work.save();
    }

    await mainStage.save();

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

    const workers = await WorkerModel.find({ projectId: projectId }).select("_id");

    if (!workers || workers.length === 0) {
      return res.status(404).json({ ok: false, message: "No workers found for this project" });
    }

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

export {
  getAllWorkMainStageDetails,
  getAllWorkSchedules,
  getAllDailySchedules,
  mdApprovalAction,
  getProjectWorkers,

  setWorkScheduleStageDeadline,
  workScheduleCompletionStatus
}