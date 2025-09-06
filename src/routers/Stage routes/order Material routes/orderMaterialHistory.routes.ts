import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';

import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { addSubItemToUnit, deleteOrderMaterialPdf, deleteSubItemFromUnit, generateOrderHistoryPDFController, getOrderHistoryMaterial, getPublicDetails, orderMaterialHistoryCompletionStatus, setOrderMaterialHistoryStageDeadline, updateDeliveryLocationDetails, updatePdfStatus, updateShopDetails, updateSubItemInUnit } from '../../../controllers/stage controllers/ordering material controller/orderMaterialHistory.controller';
// import { generateOrderHistoryPDFController } from '../../../controllers/stage controllers/ordering material controller/pdfOrderHistory.controller';

const orderMaterialHistoryRoutes = express.Router()

orderMaterialHistoryRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client"),  getOrderHistoryMaterial)
// orderMaterialHistoryRoutes.patch('/generatelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), generateOrderingMaterialLink)
orderMaterialHistoryRoutes.patch('/generatelink/:projectId/:organizationId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), generateOrderHistoryPDFController)
orderMaterialHistoryRoutes.delete('/delete/:projectId/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteOrderMaterialPdf)
orderMaterialHistoryRoutes.patch('/upddatepdfstatus/:projectId/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updatePdfStatus)


orderMaterialHistoryRoutes.get('/getpublic/:projectId', getPublicDetails)
orderMaterialHistoryRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO",) , checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel),updateDeliveryLocationDetails);
orderMaterialHistoryRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO",) , checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel),updateShopDetails);

// Add a subItem to a specific unit of a project
orderMaterialHistoryRoutes.post("/:projectId/unit/:unitId/addsubitem", multiRoleAuthMiddleware("owner", "staff", "CTO",),checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), addSubItemToUnit);

// Delete a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.delete("/:projectId/unit/:unitId/deletesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",),checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteSubItemFromUnit);

// Update a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.put("/:projectId/unit/:unitId/updatesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updateSubItemInUnit);




orderMaterialHistoryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), orderMaterialHistoryCompletionStatus)
orderMaterialHistoryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), setOrderMaterialHistoryStageDeadline)



export default orderMaterialHistoryRoutes
