import express from 'express';
import { addLabourEstimation, costEstimationCompletionStatus, deleteCostEstimationFile, deleteLabourEstimation, editLabourEstimation, getCostEstimationByProject, getLabourEstimations, getSingleRoomEstimation, setCostEstimationStageDeadline, updateMaterialEstimationItem, uploadCostEstimationFiles } from '../../../controllers/stage controllers/cost estimation controllers/costEstimation.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import MaterialRoomConfirmationModel from '../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { CostEstimationModel } from '../../../models/Stage Models/Cost Estimation Model/costEstimation.model';
import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';

const costEstimationRoutes = express.Router();


costEstimationRoutes.get('/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(MaterialRoomConfirmationModel), getCostEstimationByProject)
costEstimationRoutes.get('/:projectId/room/:roomId',  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), getSingleRoomEstimation)
costEstimationRoutes.patch("/:projectId/material/:roomId/:materialKey", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel),  notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel),updateMaterialEstimationItem);

costEstimationRoutes.get("/:projectId/labour/getlabour", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), getLabourEstimations);
costEstimationRoutes.post("/:projectId/labour", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel), addLabourEstimation);
costEstimationRoutes.patch("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel),  editLabourEstimation);
costEstimationRoutes.delete("/:projectId/labour/:labourId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), notToUpdateIfStageCompleted(CostEstimationModel),  checkIfStaffIsAssignedToStage(CostEstimationModel), deleteLabourEstimation);

costEstimationRoutes.post("/:projectId/uploads/:roomId",  multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(MaterialRoomConfirmationModel),  notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel), imageUploadToS3.array("files"), processUploadFiles, uploadCostEstimationFiles);
costEstimationRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(MaterialRoomConfirmationModel),  notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel), deleteCostEstimationFile);

costEstimationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(MaterialRoomConfirmationModel), notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel),  setCostEstimationStageDeadline)
costEstimationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(MaterialRoomConfirmationModel), notToUpdateIfStageCompleted(CostEstimationModel), checkIfStaffIsAssignedToStage(CostEstimationModel),  costEstimationCompletionStatus)



export default costEstimationRoutes