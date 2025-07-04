import { Router } from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; // your S3 uploader
import { addDailyTask, deleteDailyTask, updateDailyScheduleStatus, updateDailyTask } from "../../../controllers/stage controllers/workTasksmain controllers/dailyschedule.controller";
import { addWorkPlan, deleteWorkPlan, updateWorkPlan, updateWorkScheduleStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workSchedule.contorller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { getAllDailySchedules, getAllWorkMainStageDetails, getAllWorkSchedules, getProjectWorkers, mdApprovalAction, setWorkScheduleStageDeadline, workScheduleCompletionStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workMain.controller";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";

const workTaskRoutes = Router();

// getting the detials of main and sub models
workTaskRoutes.get("/getworktaksmain/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  getAllWorkMainStageDetails
);

workTaskRoutes.get("/getworkschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),

  getAllWorkSchedules
);

workTaskRoutes.get("/getdailyschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  getAllDailySchedules
);

// creating the tasks inside the sub models
workTaskRoutes.post("/:projectId/daily-task/:dailyScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),

  imageUploadToS3.single("file"), // single file!
  addDailyTask
);

workTaskRoutes.post("/:projectId/work-plan/:workScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),

  imageUploadToS3.single("file"),
  addWorkPlan
);

// updating the single item
workTaskRoutes.put(
  "/:projectId/daily-task/:dailyScheduleId/:taskId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),

  imageUploadToS3.single("file"),
  updateDailyTask
);

workTaskRoutes.put(
  "/:projectId/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  imageUploadToS3.single("file"),
  updateWorkPlan
);

// deleteing the single item

workTaskRoutes.delete(
  "/:projectId/daily-task/:dailyScheduleId/:taskId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  deleteDailyTask
);

workTaskRoutes.delete(
  "/:projectId/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  deleteWorkPlan
);

// status of three stages
workTaskRoutes.post(
  "/:projectId/md-approval/:mainStageId",
  multiRoleAuthMiddleware("owner, CTO"), // your MD role!
  checkPreviousStageCompleted(MaterialArrivalModel),
  mdApprovalAction
);


workTaskRoutes.patch(
  "/:projectId/daily-schedule/:dailyScheduleId/status",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  updateDailyScheduleStatus
);

workTaskRoutes.patch(
  "/:projectId/work-schedule/:workScheduleId/status",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkPreviousStageCompleted(MaterialArrivalModel),
  updateWorkScheduleStatus
);

// get workers based on project
workTaskRoutes.get("/:projectId/getworkers",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getProjectWorkers)



  // COMMON TASKS


  

  workTaskRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   checkPreviousStageCompleted(MaterialArrivalModel), setWorkScheduleStageDeadline)
  workTaskRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   checkPreviousStageCompleted(MaterialArrivalModel), workScheduleCompletionStatus)
  


export default workTaskRoutes;
