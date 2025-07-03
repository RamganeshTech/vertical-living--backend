import express from "express";

import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deleteProjectDeliveryFile, getProjectDeliveryDetails, projectDeliveryCompletionStatus, setProjectDeliveryStageDeadline, updateClientConfirmation, updateOwnerConfirmation, uploadProjectDeliveryFile } from "../../../controllers/stage controllers/Project Delivery Controllers/projectDelivery.controllers";

const projectDeliveryRoutes = express.Router();

// ✅ Upload files (images, PDFs)
projectDeliveryRoutes.post("/:projectId/upload",multiRoleAuthMiddleware("owner", "CTO", "staff"),imageUploadToS3.array("files"), uploadProjectDeliveryFile);

// ✅ Delete an uploaded file by its _id in uploads array
projectDeliveryRoutes.delete("/:projectId/upload/:fileId",multiRoleAuthMiddleware("owner", "CTO", "staff"),deleteProjectDeliveryFile);

// ✅ Update client confirmation
projectDeliveryRoutes.put("/:projectId/client-confirmation",multiRoleAuthMiddleware("owner", "client"),updateClientConfirmation);

// ✅ Update owner confirmation
projectDeliveryRoutes.put("/:projectId/owner-confirmation",multiRoleAuthMiddleware("owner"),updateOwnerConfirmation);

// ✅ Get full ProjectDelivery details (with assignedTo populated)
projectDeliveryRoutes.get("/:projectId",multiRoleAuthMiddleware("owner", "CTO", "client"),getProjectDeliveryDetails);


projectDeliveryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setProjectDeliveryStageDeadline)
projectDeliveryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), projectDeliveryCompletionStatus)


export default projectDeliveryRoutes;
