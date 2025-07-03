import { Router } from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; // your S3 uploader
import { addDailyTask, deleteDailyTask, updateDailyScheduleStatus, updateDailyTask } from "../../../controllers/stage controllers/workTasksmain controllers/dailyschedule.controller";
import { addWorkPlan, deleteWorkPlan, updateWorkPlan, updateWorkScheduleStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workSchedule.contorller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { getAllDailySchedules, getAllWorkMainStageDetails, getAllWorkSchedules, getProjectWorkers, mdApprovalAction, setWorkScheduleStageDeadline, workScheduleCompletionStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workMain.controller";

const workTaskRoutes = Router();

// getting the detials of main and sub models
workTaskRoutes.get("/getworktaksmain/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllWorkMainStageDetails
);

workTaskRoutes.get("/getworkschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllWorkSchedules
);

workTaskRoutes.get("/getdailyschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllDailySchedules
);

// creating the tasks inside the sub models
workTaskRoutes.post("/daily-task/:dailyScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"), // single file!
  addDailyTask
);

workTaskRoutes.post("/work-plan/:workScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"),
  addWorkPlan
);

// updating the single item
workTaskRoutes.put(
  "/daily-task/:dailyScheduleId/:taskId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"),
  updateDailyTask
);

workTaskRoutes.put(
  "/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"),
  updateWorkPlan
);

// deleteing the single item

workTaskRoutes.delete(
  "/daily-task/:dailyScheduleId/:taskId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteDailyTask
);

workTaskRoutes.delete(
  "/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteWorkPlan
);

// status of three stages
workTaskRoutes.post(
  "/md-approval/:mainStageId",
  multiRoleAuthMiddleware("owner, CTO"), // your MD role!
  mdApprovalAction
);


workTaskRoutes.patch(
  "/daily-schedule/:dailyScheduleId/status",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateDailyScheduleStatus
);

workTaskRoutes.patch(
  "/work-schedule/:workScheduleId/status",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateWorkScheduleStatus
);

// get workers based on project
workTaskRoutes.get("/:projectId/getworkers",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getProjectWorkers)



  // COMMON TASKS


  
  workTaskRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setWorkScheduleStageDeadline)
  workTaskRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), workScheduleCompletionStatus)
  


export default workTaskRoutes;
