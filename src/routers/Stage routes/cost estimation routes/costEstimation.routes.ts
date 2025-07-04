
import express from 'express';
import { addLabourEstimation, costEstimationCompletionStatus, deleteCostEstimationFile, deleteLabourEstimation, editLabourEstimation, getCostEstimationByProject, getLabourEstimations, getSingleRoomEstimation, setCostEstimationStageDeadline, updateMaterialEstimationItem, uploadCostEstimationFiles } from '../../../controllers/stage controllers/cost estimation controllers/costEstimation.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import MaterialRoomConfirmationModel from '../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';

const costEstimationRoutes = express.Router();


costEstimationRoutes.get('/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), checkPreviousStageCompleted(MaterialRoomConfirmationModel), getCostEstimationByProject)
costEstimationRoutes.get('/:projectId/room/:roomId',  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), getSingleRoomEstimation)
costEstimationRoutes.patch("/:projectId/material/:materialKey", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), updateMaterialEstimationItem);

costEstimationRoutes.get("/:projectId/labour/getlabour", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), getLabourEstimations);
costEstimationRoutes.post("/:projectId/labour", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel),addLabourEstimation);
costEstimationRoutes.patch("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), editLabourEstimation);
costEstimationRoutes.delete("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), deleteLabourEstimation);

costEstimationRoutes.post("/:projectId/uploads/:roomId",  multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), imageUploadToS3.array("files"), uploadCostEstimationFiles);
costEstimationRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(MaterialRoomConfirmationModel), deleteCostEstimationFile);

costEstimationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(MaterialRoomConfirmationModel), setCostEstimationStageDeadline)
costEstimationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(MaterialRoomConfirmationModel), costEstimationCompletionStatus)



export default costEstimationRoutes