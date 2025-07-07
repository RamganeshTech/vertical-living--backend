import { Router } from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; 
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { uploadCleaningStageFiles, deleteCleaningStageFile,
  updateRoomCleaningStatus,
  getCleaningAndSanitationDetails,
  getSingleCleaningStageRoomDetails,
  setCleaningStageDeadline,
  cleaningStageCompletionStatus,
  updateCleaningStageRoomNotes, } from "../../../controllers/stage controllers/Cleaning controller/cleaning.controller";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";



const cleaningRoutes = Router();

// ✅ Upload multiple images/pdfs to a room
cleaningRoutes.post(
  "/:projectId/:roomId/upload",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(QualityCheckupModel),
  imageUploadToS3.array("files"), // allows multiple files: `files` is your form field name
  processUploadFiles,
  uploadCleaningStageFiles
);

// ✅ Delete one uploaded file from a room
cleaningRoutes.delete(
  "/:projectId/:roomId/:fileId/file",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(QualityCheckupModel),
  deleteCleaningStageFile
);

// ✅ Update `completelyCleaned` for a room
cleaningRoutes.put(
  "/:projectId/:roomId/cleaning-status",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(QualityCheckupModel),
  updateRoomCleaningStatus
);

// ✅ Get all Cleaning & Sanitation info for a project
cleaningRoutes.get(
  "/:projectId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(QualityCheckupModel),
  getCleaningAndSanitationDetails
);

// ✅ Get details for a single room by roomId
cleaningRoutes.get(
  "/:projectId/:roomId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(QualityCheckupModel),
  getSingleCleaningStageRoomDetails
);

cleaningRoutes.put(
  "/:projectId/room/:roomId/notes",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  checkPreviousStageCompleted(QualityCheckupModel),
  updateCleaningStageRoomNotes
);

cleaningRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(QualityCheckupModel), setCleaningStageDeadline)
cleaningRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(QualityCheckupModel), cleaningStageCompletionStatus)


export default cleaningRoutes;
