import { Router } from "express";

import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { approveStep, getAdminSOP, getAdminStepDetails, uploadAdminCorrectionRound } from "../../controllers/Wall Painting controllers/adminWallPainting.controller";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";

// Middlewares you probably already have:

const adminWallroutes = Router();

// ✅ Get full Admin SOP details
adminWallroutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getAdminSOP);

// ✅ Get specific step detail
adminWallroutes.get("/:projectId/step/:stepId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAdminStepDetails);

// ✅ Upload admin correction round for a step
adminWallroutes.post(
  "/:projectId/step/:stepNumber/correction",
  multiRoleAuthMiddleware("owner", "staff", "CTO", ),
  imageUploadToS3.array("files"), // For multiple files
    processUploadFiles,
  uploadAdminCorrectionRound
);

// ✅ Approve or reject a step
adminWallroutes.patch(
  "/:projectId/step/:stepId/approve",
  multiRoleAuthMiddleware("owner", "staff", "CTO", ),
  approveStep
);

export default adminWallroutes;
