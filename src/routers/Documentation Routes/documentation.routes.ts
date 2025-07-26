// routes/documentationRoutes.ts

import express from 'express';
import { addOrUpdateStageDocumentation, deleteStageFile, getAllStageDocumentation, getSingleStageDocumentation, manuallyGenerateStagePdfAndSendMail, updateStageDescription, uploadFilesToStage } from '../../controllers/documentation controller/documentation.controller';
import { multiRoleAuthMiddleware } from './../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { getClientByProjectId, getStageShareMessage } from '../../controllers/documentation controller/getClientForMessage.controller';

const documentationRoutes = express.Router();

documentationRoutes.post('/:projectId/create',  multiRoleAuthMiddleware("owner", "CTO", "staff"),addOrUpdateStageDocumentation);

documentationRoutes.get('/:projectId/getalldetails', multiRoleAuthMiddleware("owner", "CTO", "staff", "client"), getAllStageDocumentation);

documentationRoutes.get('/:projectId/stage/:stageNumber', multiRoleAuthMiddleware("owner", "CTO", "staff", "client"), getSingleStageDocumentation);


documentationRoutes.post(
  "/:projectId/:stageNumber/upload",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  imageUploadToS3.array("files"),
  processUploadFiles,
  uploadFilesToStage
);

// ✅ Delete a specific uploaded file from a stage
documentationRoutes.delete(
  "/:projectId/:stageNumber/file/:fileId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  deleteStageFile
);

// ✅ Update the description of a stage
documentationRoutes.patch(
  "/:projectId/:stageNumber/description",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  updateStageDescription
);


documentationRoutes.put(
  "/updatedocument/:projectId/:stageNumber",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  manuallyGenerateStagePdfAndSendMail
);



// ✅ Update the description of a stage
documentationRoutes.get(
  "/getclient/:projectId/byproject",
  // multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getClientByProjectId
);


documentationRoutes.get(
  "/sharemessage/:projectId/:stageNumber",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getStageShareMessage
);




export default documentationRoutes;
