import { Router } from "express";

import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { approveStep, getAdminSOP, getAdminStepDetails, uploadAdminCorrectionRound } from "../../controllers/Wall Painting controllers/adminWallPainting.controller";

// Middlewares you probably already have:

const adminWallroutes = Router();

// ✅ Get full Admin SOP details
adminWallroutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getAdminSOP);



// ✅ Get specific step detail
adminWallroutes.get("/:projectId/step/:stepId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAdminStepDetails);

// ✅ Upload admin correction round for a step
adminWallroutes.post(
  "/:projectId/step/:stepId/correction",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
  uploadAdminCorrectionRound
);

// ✅ Approve or reject a step
adminWallroutes.patch(
  "/:projectId/step/:stepId/approve",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
  approveStep
);

export default adminWallroutes;
