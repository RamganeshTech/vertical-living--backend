import { Router } from "express";

import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { createQualityCheckItem, editQualityCheckItem,
deleteQualityCheckItem,
getQualityCheckup,
getQualityCheckRoomItems,
setQualityCheckStageDeadline,
qualityCheckCompletionStatus, } from "../../../controllers/stage controllers/QualityCheck controllers/QualityCheck.controller";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3upload";
import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";


const qualityCheckRoutes = Router();

// === CREATE ===
// POST /api/quality-check/:projectId/:roomName/item/create
qualityCheckRoutes.post(
  "/:projectId/:roomName/item/create",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  checkPreviousStageCompleted(InstallationModel),
  notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),
  
  imageUploadToS3.single("file"),
  createQualityCheckItem
);

// === EDIT ===
// PUT /api/quality-check/:projectId/:roomName/:itemId/item/edit
qualityCheckRoutes.put(
  "/:projectId/:roomName/:itemId/item/edit",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  checkPreviousStageCompleted(InstallationModel),
  notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),

  imageUploadToS3.single("file"),
  editQualityCheckItem
);

// === DELETE ===
// DELETE /api/quality-check/:projectId/:roomName/:itemId/item/delete
qualityCheckRoutes.delete(
  "/:projectId/:roomName/:itemId/item/delete",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  checkPreviousStageCompleted(InstallationModel),
  notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),


  deleteQualityCheckItem
);

// === GET ALL ===
// GET /api/quality-check/:projectId
qualityCheckRoutes.get(
  "/:projectId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(InstallationModel),
  getQualityCheckup
);

// === GET SINGLE ROOM ===
// GET /api/quality-check/:projectId/:roomName
qualityCheckRoutes.get(
  "/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  checkPreviousStageCompleted(InstallationModel),
  getQualityCheckRoomItems
);





  
qualityCheckRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(InstallationModel), notToUpdateIfStageCompleted(QualityCheckupModel), checkIfStaffIsAssignedToStage(QualityCheckupModel), setQualityCheckStageDeadline)
qualityCheckRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(InstallationModel),notToUpdateIfStageCompleted(QualityCheckupModel), checkIfStaffIsAssignedToStage(QualityCheckupModel),  qualityCheckCompletionStatus)

export default qualityCheckRoutes;
