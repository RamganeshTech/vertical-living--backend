import { Router } from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; // your S3 uploader
import { 
  addComparisonSelectImage,
  createWork,
  deleteDailyScheduleImage,
  deleteWork,
  deleteWorkCorrectImages,
  deleteWorkSelectImage,
  generateWorkSchedulePDFController,
  getCurrentProjectDetailsWork,
  // deleteDailyScheduleImage,
  // deleteWork,
  // addDailyTask, deleteDailyTask,
   updateDailyScheduleStatus,
   updateSelectedImageComment,
   updateWork,
   uploadComparisonImagesManually,
   uploadCorrectImages,
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

workTaskRoutes.post("/:projectId/work-plan/:workScheduleId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  // checkPreviousStageCompleted(MaterialArrivalModel),
  // notToUpdateIfStageCompleted(WorkMainStageScheduleModel),
  checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),
  imageUploadToS3.single("file"),
  processUploadFiles,
  addWorkPlan
);

workTaskRoutes.put(
  "/:projectId/work-plan/:workScheduleId/:planId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  checkIfStaffIsAssignedToStage(WorkMainStageScheduleModel),
  imageUploadToS3.single("file"),
  processUploadFiles,
  updateWorkPlan
);

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




//  Daily schedule images starts from here (OLD VERRIOIN CALENDER UI) 
// workTaskRoutes.post("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), createWork);

// workTaskRoutes.put("/:projectId/update/:taskId", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateWork);

// workTaskRoutes.delete("/:projectId/:taskId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteWork);

// workTaskRoutes.post(
//   "/:projectId/:taskId/uploads/:dateId",
//   imageUploadToS3.array("files"), // already filters multiple
//   processUploadFiles,
//   uploadDailyScheduleImages
// );


// workTaskRoutes.delete(
//   "/:projectId/:taskId/uploads/:dateId/:imageId",
//   deleteDailyScheduleImage
// );



workTaskRoutes.post("/create/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"),
//  imageUploadToS3.array("files"),
imageUploadToS3.fields([
  { name: 'designPlanImages', maxCount: 1000 }, // practically unlimited
  { name: 'siteImages', maxCount: 1000 },
  { name: 'comparison', maxCount: 1000 },
   { name: 'actualImage', maxCount: 1 },   // add this
  { name: 'plannedImage', maxCount: 1 },  // add this
]),
  processUploadFiles, createWork);


workTaskRoutes.put("/update/:projectId/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),
 imageUploadToS3.fields([
    { name: "designPlanImages", maxCount: 1000 },
    { name: "siteImages", maxCount: 1000 },
    { name: "comparison", maxCount: 1000 },
    { name: "actualImage", maxCount: 1 },
    { name: "plannedImage", maxCount: 1 },
  ]),
  processUploadFiles,
updateWork);

workTaskRoutes.delete("/:scheduleId/:taskId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteWork);


workTaskRoutes.post(
  "/:scheduleId/task/:taskId/upload",
  imageUploadToS3.array("files"),
  processUploadFiles,
  uploadDailyScheduleImages
);


workTaskRoutes.delete(
  "/:scheduleId/deleteworkimage/:taskId/date/:date/image/:imageId",
  deleteDailyScheduleImage
);


workTaskRoutes.post(
  "/generatePdf/work/:projectId/:scheduleId",
  imageUploadToS3.fields([
  { name: 'designPlanImages', maxCount: 1000 }, // practically unlimited
  { name: 'siteImages', maxCount: 1000 },
  { name: 'comparison', maxCount: 1000 },
   { name: 'actualImage', maxCount: 1 },   // add this
  { name: 'plannedImage', maxCount: 1 },  // add this
]),
  processUploadFiles,
  generateWorkSchedulePDFController
);



workTaskRoutes.post(
  "/createcorrection/:scheduleId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  addComparisonSelectImage
);


workTaskRoutes.put('/uploadselectimagemanually/:scheduleId/:comparisonId',
   imageUploadToS3.array("correctfiles"), processUploadFiles, uploadComparisonImagesManually)
   
workTaskRoutes.put('/uploadcorrectedimage/:scheduleId/:comparisonId',
   imageUploadToS3.array("files"), processUploadFiles, uploadCorrectImages)
   
workTaskRoutes.put(
  "/updateSelectimagecomment/:scheduleId/:comparisonId/:selectedImageId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  updateSelectedImageComment
);


workTaskRoutes.delete('/deletecorrectedimages/:scheduleId/:comparisonId/:imageId', deleteWorkCorrectImages)
workTaskRoutes.delete('/deleteselectimages/:scheduleId/:comparisonId/:selectId', deleteWorkSelectImage)


// get workers based on the project

workTaskRoutes.get(
  "/getprojectassigne/:projectId",
  getCurrentProjectDetailsWork
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
