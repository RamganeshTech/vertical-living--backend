import { Router } from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; // your S3 uploader
import { 
  createWork,
  deleteDailyScheduleImage,
  deleteWork,
  // addDailyTask, deleteDailyTask,
   updateDailyScheduleStatus,
   updateWork,
   uploadDailyScheduleImages,
    // updateDailyTask
   } from "../../../controllers/stage controllers/workTasksmain controllers/dailyschedule.controller";
import { addWorkPlan, deleteWorkPlan, updateWorkPlan, updateWorkScheduleStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workSchedule.contorller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { getAllDailySchedules, getAllWorkMainStageDetails, getAllWorkSchedules, getProjectWorkers, mdApprovalAction, setWorkScheduleStageDeadline, workScheduleCompletionStatus } from "../../../controllers/stage controllers/workTasksmain controllers/workMain.controller";
// import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";

const workTaskRoutes = Router();

// getting the detials of main and sub models
workTaskRoutes.get("/getworktaksmain/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "staff"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  getAllWorkMainStageDetails
);

workTaskRoutes.get("/getworkschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "staff"),
  // checkPreviousStageCompleted(MaterialArrivalModel),

  getAllWorkSchedules
);

workTaskRoutes.get("/getdailyschedule/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "staff"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  getAllDailySchedules
);

// creating the tasks inside the sub models
// workTaskRoutes.post("/:projectId/daily-task/:dailyScheduleId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   // checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
//   checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),
//   imageUploadToS3.single("file"), // single file!
//   processUploadFiles,
//   addDailyTask
// );

workTaskRoutes.post("/:projectId/work-plan/:workScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
  checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

  imageUploadToS3.single("file"),
  processUploadFiles,

  addWorkPlan
);

// updating the single item
// workTaskRoutes.put(
//   "/:projectId/daily-task/:dailyScheduleId/:taskId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   // checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
//   checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

//   imageUploadToS3.single("file"),
//   processUploadFiles,
//   updateDailyTask
// );

workTaskRoutes.put(
  "/:projectId/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
  checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

  imageUploadToS3.single("file"),
  processUploadFiles,

  updateWorkPlan
);

// deleteing the single item

// workTaskRoutes.delete(
//   "/:projectId/daily-task/:dailyScheduleId/:taskId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   // checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
//   checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

//   deleteDailyTask
// );

workTaskRoutes.delete(
  "/:projectId/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
  checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

  deleteWorkPlan
);

// status of three stages
// workTaskRoutes.post(
//   "/:projectId/md-approval/:mainStageId",
//   multiRoleAuthMiddleware("owner"), // your MD role!
//   // checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),

//   mdApprovalAction
// );


// workTaskRoutes.patch(
//   "/:projectId/daily-schedule/:dailyScheduleId/status",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
//   // checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

//   updateDailyScheduleStatus
// );

// workTaskRoutes.patch(
//   "/:projectId/work-schedule/:workScheduleId/status",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   checkPreviousStageCompleted(MaterialArrivalModel),
//   // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
//   // checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),

//   updateWorkScheduleStatus
// );


workTaskRoutes.post("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), createWork);

workTaskRoutes.put("/:projectId/update/:taskId", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateWork);

workTaskRoutes.delete("/:projectId/:taskId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteWork);

workTaskRoutes.post(
  "/:projectId/:taskId/uploads/:dateId",
  imageUploadToS3.array("files"), // already filters multiple
  processUploadFiles,
  uploadDailyScheduleImages
);


workTaskRoutes.delete(
  "/:projectId/:taskId/uploads/:dateId/:imageId",
  deleteDailyScheduleImage
);


// get workers based on project
workTaskRoutes.get("/:projectId/getworkers",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getProjectWorkers)



// COMMON TASKS

workTaskRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),
//  checkPreviousStageCompleted(MaterialArrivalModel), notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
  setWorkScheduleStageDeadline)

workTaskRoutes.put('/completionstatus/:projectId', 
  // multiRoleAuthMiddleware("owner", "staff", "CTO",),
//  checkPreviousStageCompleted(MaterialArrivalModel), notToUpdateIfStageCompleted(WorkMainStageScheduleModel), 
 workScheduleCompletionStatus)

export default workTaskRoutes;
