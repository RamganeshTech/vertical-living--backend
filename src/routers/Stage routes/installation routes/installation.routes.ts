import { Router } from "express";
import {
  //  createInstallationItem , editInstallationItem,
  // deleteInstallationItem,
  updateInstallationTaskStatus,
  getInstallationDetails,
  // getInstallationRoomDetails,
  setInstallationStageDeadline,
  installationCompletionStatus,
} from "../../../controllers/stage controllers/installation controllers/installation.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
// import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";

const installationRoutes = Router();

// installationRoutes.post("/:projectId/:roomName/item/create", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"),   checkPreviousStageCompleted(MaterialArrivalModel),notToUpdateIfStageCompleted(InstallationModel), checkIfStaffIsAssignedToStage(InstallationModel), imageUploadToS3.single("file"), processUploadFiles, createInstallationItem);

// installationRoutes.put("/:projectId/:roomName/item/edit",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(MaterialArrivalModel),notToUpdateIfStageCompleted(InstallationModel),  checkIfStaffIsAssignedToStage(InstallationModel),imageUploadToS3.single("file"), processUploadFiles, editInstallationItem);
// installationRoutes.delete("/:projectId/item/delete", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(MaterialArrivalModel),notToUpdateIfStageCompleted(InstallationModel), checkIfStaffIsAssignedToStage(InstallationModel),deleteInstallationItem);
// installationRoutes.get("/:projectId/getroomdetail/:roomName", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker", "client"), checkPreviousStageCompleted(MaterialArrivalModel), getInstallationRoomDetails);
installationRoutes.get("/:projectId/getalldetail",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker", "client"), getInstallationDetails);
installationRoutes.put("/:projectId/:taskId/status",notToUpdateIfStageCompleted(InstallationModel), checkIfStaffIsAssignedToStage(InstallationModel), updateInstallationTaskStatus);

installationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   checkIfStaffIsAssignedToStage(InstallationModel),setInstallationStageDeadline)
installationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   checkIfStaffIsAssignedToStage(InstallationModel),installationCompletionStatus)

export default installationRoutes;
