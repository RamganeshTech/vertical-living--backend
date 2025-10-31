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
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";


const qualityCheckRoutes = Router();

qualityCheckRoutes.post(
  "/:projectId/:roomName/item/create",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  // checkPreviousStageCompleted(InstallationModel),
  // notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),
  
  imageUploadToS3.single("file"),
  processUploadFiles,
  createQualityCheckItem
);

qualityCheckRoutes.put(
  "/:projectId/:roomName/:itemId/item/edit",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  // checkPreviousStageCompleted(InstallationModel),
  // notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),

  imageUploadToS3.single("file"),
  processUploadFiles,
  editQualityCheckItem
);

qualityCheckRoutes.delete(
  "/:projectId/:roomName/:itemId/item/delete",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  // checkPreviousStageCompleted(InstallationModel),
  // notToUpdateIfStageCompleted(QualityCheckupModel),
  checkIfStaffIsAssignedToStage(QualityCheckupModel),
  deleteQualityCheckItem
);

qualityCheckRoutes.get(
  "/:projectId",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  // checkPreviousStageCompleted(InstallationModel),
  getQualityCheckup
);

qualityCheckRoutes.get(
  "/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"),
  // checkPreviousStageCompleted(InstallationModel),
  getQualityCheckRoomItems
);
  
qualityCheckRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(QualityCheckupModel), setQualityCheckStageDeadline)
qualityCheckRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(QualityCheckupModel),  qualityCheckCompletionStatus)

export default qualityCheckRoutes;
