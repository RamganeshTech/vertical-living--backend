import express from "express";

import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deleteProjectDeliveryFile, getProjectDeliveryDetails, projectDeliveryCompletionStatus, setProjectDeliveryStageDeadline, updateClientConfirmation, updateOwnerConfirmation, uploadProjectDeliveryFile } from "../../../controllers/stage controllers/Project Delivery Controllers/projectDelivery.controllers";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { CleaningAndSanitationModel } from "../../../models/Stage Models/Cleaning Model/cleaning.model";

const projectDeliveryRoutes = express.Router();

// ✅ Upload files (images, PDFs)
projectDeliveryRoutes.post("/:projectId/upload",multiRoleAuthMiddleware("owner", "CTO", "staff"),checkPreviousStageCompleted(CleaningAndSanitationModel),imageUploadToS3.array("files"), uploadProjectDeliveryFile);

// ✅ Delete an uploaded file by its _id in uploads array
projectDeliveryRoutes.delete("/:projectId/upload/:fileId",multiRoleAuthMiddleware("owner", "CTO", "staff"),checkPreviousStageCompleted(CleaningAndSanitationModel),deleteProjectDeliveryFile);

// ✅ Update client confirmation
projectDeliveryRoutes.put("/:projectId/client-confirmation",multiRoleAuthMiddleware("owner", "client"),checkPreviousStageCompleted(CleaningAndSanitationModel),updateClientConfirmation);

// ✅ Update owner confirmation
projectDeliveryRoutes.put("/:projectId/owner-confirmation",multiRoleAuthMiddleware("owner"),checkPreviousStageCompleted(CleaningAndSanitationModel),updateOwnerConfirmation);

// ✅ Get full ProjectDelivery details (with assignedTo populated)
projectDeliveryRoutes.get("/:projectId",multiRoleAuthMiddleware("owner", "CTO", "client"),checkPreviousStageCompleted(CleaningAndSanitationModel),getProjectDeliveryDetails);


projectDeliveryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CleaningAndSanitationModel), setProjectDeliveryStageDeadline)
projectDeliveryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(CleaningAndSanitationModel),projectDeliveryCompletionStatus)


export default projectDeliveryRoutes;
