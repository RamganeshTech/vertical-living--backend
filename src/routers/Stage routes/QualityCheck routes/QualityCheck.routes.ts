import { Router } from "express";

import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { createQualityCheckItem, editQualityCheckItem,
deleteQualityCheckItem,
getQualityCheckup,
getQualityCheckRoomItems, } from "../../../controllers/stage controllers/QualityCheck controllers/QualityCheck.controller";


const qualityCheckRoutes = Router();

// === CREATE ===
// POST /api/quality-check/:projectId/:roomName/item/create
qualityCheckRoutes.post(
  "/:projectId/:roomName/item/create",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  imageUploadToS3.single("file"),
  createQualityCheckItem
);

// === EDIT ===
// PUT /api/quality-check/:projectId/:roomName/:itemId/item/edit
qualityCheckRoutes.put(
  "/:projectId/:roomName/:itemId/item/edit",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  imageUploadToS3.single("file"),
  editQualityCheckItem
);

// === DELETE ===
// DELETE /api/quality-check/:projectId/:roomName/:itemId/item/delete
qualityCheckRoutes.delete(
  "/:projectId/:roomName/:itemId/item/delete",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  deleteQualityCheckItem
);

// === GET ALL ===
// GET /api/quality-check/:projectId
qualityCheckRoutes.get(
  "/:projectId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  getQualityCheckup
);

// === GET SINGLE ROOM ===
// GET /api/quality-check/:projectId/:roomName
qualityCheckRoutes.get(
  "/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  getQualityCheckRoomItems
);
export default qualityCheckRoutes;
