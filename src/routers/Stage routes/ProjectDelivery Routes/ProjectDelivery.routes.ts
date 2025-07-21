import express from "express";

// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deleteProjectDeliveryFile, getProjectDeliveryDetails, projectDeliveryCompletionStatus, setProjectDeliveryStageDeadline, updateClientConfirmation, updateOwnerConfirmation, uploadProjectDeliveryFile } from "../../../controllers/stage controllers/Project Delivery Controllers/projectDelivery.controllers";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { CleaningAndSanitationModel } from "../../../models/Stage Models/Cleaning Model/cleaning.model";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { ProjectDeliveryModel } from "../../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";

const projectDeliveryRoutes = express.Router();

// ✅ Upload files (images, PDFs)
projectDeliveryRoutes.post("/:projectId/upload",multiRoleAuthMiddleware("owner", "CTO", "staff"),checkPreviousStageCompleted(CleaningAndSanitationModel), notToUpdateIfStageCompleted(ProjectDeliveryModel), checkIfStaffIsAssignedToStage(ProjectDeliveryModel), imageUploadToS3.array("files"), processUploadFiles, uploadProjectDeliveryFile);

// ✅ Delete an uploaded file by its _id in uploads array
projectDeliveryRoutes.delete("/:projectId/upload/:fileId",multiRoleAuthMiddleware("owner", "CTO", "staff"),checkPreviousStageCompleted(CleaningAndSanitationModel),notToUpdateIfStageCompleted(ProjectDeliveryModel), checkIfStaffIsAssignedToStage(ProjectDeliveryModel), deleteProjectDeliveryFile);

// ✅ Update client confirmation
projectDeliveryRoutes.put("/:projectId/client-confirmation",multiRoleAuthMiddleware("client"),checkPreviousStageCompleted(CleaningAndSanitationModel),notToUpdateIfStageCompleted(ProjectDeliveryModel),checkIfStaffIsAssignedToStage(ProjectDeliveryModel),  updateClientConfirmation);

// ✅ Update owner confirmation
projectDeliveryRoutes.put("/:projectId/owner-confirmation",multiRoleAuthMiddleware("owner"),checkPreviousStageCompleted(CleaningAndSanitationModel),notToUpdateIfStageCompleted(ProjectDeliveryModel), checkIfStaffIsAssignedToStage(ProjectDeliveryModel), updateOwnerConfirmation);

// ✅ Get full ProjectDelivery details (with assignedTo populated)
projectDeliveryRoutes.get("/:projectId",multiRoleAuthMiddleware("owner", "CTO", "client", "staff"),checkPreviousStageCompleted(CleaningAndSanitationModel),getProjectDeliveryDetails);


projectDeliveryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CleaningAndSanitationModel),  notToUpdateIfStageCompleted(ProjectDeliveryModel), checkIfStaffIsAssignedToStage(ProjectDeliveryModel), setProjectDeliveryStageDeadline)
projectDeliveryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(CleaningAndSanitationModel), notToUpdateIfStageCompleted(ProjectDeliveryModel), checkIfStaffIsAssignedToStage(ProjectDeliveryModel), projectDeliveryCompletionStatus)


export default projectDeliveryRoutes;
