import { Router } from "express";
import { createInstallationItem , editInstallationItem,
  deleteInstallationItem,
  getInstallationDetails,
  getInstallationRoomDetails,
  setInstallationStageDeadline,
  installationCompletionStatus,
} from "../../../controllers/stage controllers/installation controllers/installation.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";

const installationRoutes = Router();

installationRoutes.post("/:projectId/:roomName/item/create", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), imageUploadToS3.single("file"), createInstallationItem);
installationRoutes.put("/:projectId/:roomName/item/edit",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), imageUploadToS3.single("file"), editInstallationItem);
installationRoutes.delete("/item/delete", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"),deleteInstallationItem);
installationRoutes.get("/:projectId/getalldetail",multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"), getInstallationDetails);
installationRoutes.get("/:projectId/getroomdetail/:roomName", multiRoleAuthMiddleware("CTO", "owner", "staff", "worker"),getInstallationRoomDetails);


installationRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setInstallationStageDeadline)
installationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), installationCompletionStatus)

export default installationRoutes;
