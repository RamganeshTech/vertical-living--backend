import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';

import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { addSubItemToUnit, deleteSubItemFromUnit, generateOrderingMaterialLink, getOrderHistoryMaterial, getPublicDetails, orderMaterialHistoryCompletionStatus, setOrderMaterialHistoryStageDeadline, updateSubItemInUnit } from '../../../controllers/stage controllers/ordering material controller/orderMaterialHistory.controller';

const orderMaterialHistoryRoutes = express.Router()

orderMaterialHistoryRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client"), checkPreviousStageCompleted(PaymentConfirmationModel), getOrderHistoryMaterial)
orderMaterialHistoryRoutes.patch('/generatelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), generateOrderingMaterialLink)
orderMaterialHistoryRoutes.get('/getpublic/:projectId', getPublicDetails)

// Add a subItem to a specific unit of a project
orderMaterialHistoryRoutes.post("/:projectId/unit/:unitId/addsubitem", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), addSubItemToUnit);

// Delete a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.delete("/:projectId/unit/:unitId/deletesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteSubItemFromUnit);

// Update a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.put("/:projectId/unit/:unitId/updatesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updateSubItemInUnit);




orderMaterialHistoryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel),checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), orderMaterialHistoryCompletionStatus)
orderMaterialHistoryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), setOrderMaterialHistoryStageDeadline)



export default orderMaterialHistoryRoutes
