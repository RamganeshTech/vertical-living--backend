import { Router } from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { createStudio, deleteStudio, getAllStudios, getStudioById } from '../../controllers/studios_controllers/studio.controller';



const StudiosRoutes = Router();


// StudiosRoutes.post(
//     "/:organizationId/save",
  
//       multiRoleAuthMiddleware("owner", "staff", "CTO"),
//       uploadFloorPlanFile,        // multer memory storage, PDF only, size limit
//       validateFloorPlanRequest,   // auth context, project ownership, real readable PDF
//       processUploadFiles,         // existing middleware: uploads to S3, sets req.file.location
//     extractFloorPlan
// );

StudiosRoutes.post(
  "/:organizationId/create",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"), // see the first note below
  processUploadFiles,
  createStudio
);

StudiosRoutes.get("/:organizationId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllStudios);
StudiosRoutes.get("/:organizationId/:studioId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getStudioById);
StudiosRoutes.delete("/:organizationId/:studioId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteStudio);


export default StudiosRoutes;