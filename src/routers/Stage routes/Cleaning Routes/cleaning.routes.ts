import { Router } from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader"; 
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { uploadCleaningStageFiles, deleteCleaningStageFile,
  updateRoomCleaningStatus,
  getCleaningAndSanitationDetails,
  getSingleCleaningStageRoomDetails,
  setCleaningStageDeadline,
  cleaningStageCompletionStatus,
  updateCleaningStageRoomNotes, } from "../../../controllers/stage controllers/Cleaning controller/cleaning.controller";



const cleaningRoutes = Router();

// ✅ Upload multiple images/pdfs to a room
cleaningRoutes.post(
  "/:projectId/:roomId/upload",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  imageUploadToS3.array("files"), // allows multiple files: `files` is your form field name
  uploadCleaningStageFiles
);

// ✅ Delete one uploaded file from a room
cleaningRoutes.delete(
  "/:projectId/:roomId/:fileId/file",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  deleteCleaningStageFile
);

// ✅ Update `completelyCleaned` for a room
cleaningRoutes.put(
  "/:projectId/:roomId/cleaning-status",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  updateRoomCleaningStatus
);

// ✅ Get all Cleaning & Sanitation info for a project
cleaningRoutes.get(
  "/:projectId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  getCleaningAndSanitationDetails
);

// ✅ Get details for a single room by roomId
cleaningRoutes.get(
  "/:projectId/:roomId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  getSingleCleaningStageRoomDetails
);

cleaningRoutes.put(
  "/:projectId/room/:roomId/notes",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  updateCleaningStageRoomNotes
);

cleaningRoutes.put('/deadline//:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setCleaningStageDeadline)
cleaningRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), cleaningStageCompletionStatus)


export default cleaningRoutes;
