
import express from 'express';
import { addLabourEstimation, costEstimationCompletionStatus, deleteCostEstimationFile, deleteLabourEstimation, editLabourEstimation, getCostEstimationByProject, getLabourEstimations, getSingleRoomEstimation, setCostEstimationStageDeadline, updateMaterialEstimationItem, uploadCostEstimationFiles } from '../../../controllers/stage controllers/cost estimation controllers/costEstimation.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';

const costEstimationRoutes = express.Router();


costEstimationRoutes.get('/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), getCostEstimationByProject)
costEstimationRoutes.get('/:projectId/room/:roomId',  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getSingleRoomEstimation)
costEstimationRoutes.patch("/:projectId/material/:materialKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateMaterialEstimationItem);

costEstimationRoutes.get("/:projectId/labour/getlabour", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getLabourEstimations);
costEstimationRoutes.post("/:projectId/labour", multiRoleAuthMiddleware("owner", "staff", "CTO"), addLabourEstimation);
costEstimationRoutes.patch("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"), editLabourEstimation);
costEstimationRoutes.delete("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteLabourEstimation);


costEstimationRoutes.post("/:projectId/uploads/:roomId", imageUploadToS3.array("files"), multiRoleAuthMiddleware("owner", "staff", "CTO",) , uploadCostEstimationFiles);
costEstimationRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , deleteCostEstimationFile);

costEstimationRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setCostEstimationStageDeadline)
costEstimationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), costEstimationCompletionStatus)



export default costEstimationRoutes