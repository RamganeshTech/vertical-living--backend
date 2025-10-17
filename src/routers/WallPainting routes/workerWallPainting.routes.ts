import { Router } from "express";
import { getWorkerSOP, getWorkerStepDetails, uploadWorkerCorrectionFiles, uploadWorkerInitialFiles } from "../../controllers/Wall Painting controllers/workerWallPainting.controller";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";


const workerWallRoutes = Router();

// ✅ Get full Worker SOP details
workerWallRoutes.get("/:projectId", multiRoleAuthMiddleware("worker", "staff", "owner", "CTO"), getWorkerSOP);

// ✅ Get specific step detail
workerWallRoutes.get("/:projectId/step/:stepId", multiRoleAuthMiddleware("worker", "staff",  "owner", "CTO"), getWorkerStepDetails);

// ✅ Upload initial files to a step
workerWallRoutes.post(
  "/:projectId/step/:stepNumber/initial",
  multiRoleAuthMiddleware("worker", "staff", "owner", "CTO"),
  imageUploadToS3.array("files"), // For multiple files
  processUploadFiles,
  uploadWorkerInitialFiles
);
 
// ✅ Upload correction files for a correction round
workerWallRoutes.post(
  "/:projectId/step/:stepNumber/correction/:correctionRound",
  multiRoleAuthMiddleware("worker","staff", "owner", "CTO"),
  imageUploadToS3.array("files"),
  processUploadFiles,
  uploadWorkerCorrectionFiles
);

export default workerWallRoutes;
