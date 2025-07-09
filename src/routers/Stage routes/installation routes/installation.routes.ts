import { Router } from "express";
import { createInstallationItem , editInstallationItem,
  deleteInstallationItem,
  getInstallationDetails,
  getInstallationRoomDetails,
  setInstallationStageDeadline,
  installationCompletionStatus,
} from "../../../controllers/stage controllers/installation controllers/installation.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";

const installationRoutes = Router();

installationRoutes.post("/:projectId/:roomName/item/create", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"),   checkPreviousStageCompleted(WorkMainStageScheduleModel),notToUpdateIfStageCompleted(InstallationModel), imageUploadToS3.single("file"), processUploadFiles, createInstallationItem);

installationRoutes.put("/:projectId/:roomName/item/edit",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(WorkMainStageScheduleModel),notToUpdateIfStageCompleted(InstallationModel), imageUploadToS3.single("file"), processUploadFiles, editInstallationItem);
installationRoutes.delete("/:projectId/item/delete", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(WorkMainStageScheduleModel),notToUpdateIfStageCompleted(InstallationModel),deleteInstallationItem);
installationRoutes.get("/:projectId/getalldetail",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(WorkMainStageScheduleModel) ,getInstallationDetails);
installationRoutes.get("/:projectId/getroomdetail/:roomName", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), checkPreviousStageCompleted(WorkMainStageScheduleModel), getInstallationRoomDetails);


installationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(WorkMainStageScheduleModel),notToUpdateIfStageCompleted(InstallationModel),setInstallationStageDeadline)
installationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(WorkMainStageScheduleModel),notToUpdateIfStageCompleted(InstallationModel),installationCompletionStatus)

export default installationRoutes;
