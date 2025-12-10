import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';

import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { addSubItemToUnit, deleteAllSubUnits, deleteOrderingMaterialImage, deleteOrderMaterialPdf, deleteSubItemFromUnit, generateOrderHistoryPDFController, getOrderHistoryMaterial, getPublicDetails, getSingleOrderedItem,  orderMaterialHistoryCompletionStatus, placeOrderToProcurement, setOrderMaterialHistoryStageDeadline, submitOrderMaterial, updateDeliveryLocationDetails, updatePdfStatus, updateShopDetails, updateSubItemInUnit, uploadOrderMaterialImages } from '../../../controllers/stage controllers/ordering material controller/orderMaterialHistory.controller';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
// import { generateOrderHistoryPDFController } from '../../../controllers/stage controllers/ordering material controller/pdfOrderHistory.controller';

const orderMaterialHistoryRoutes = express.Router()

orderMaterialHistoryRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client"), getOrderHistoryMaterial)
// orderMaterialHistoryRoutes.patch('/generatelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), generateOrderingMaterialLink)
orderMaterialHistoryRoutes.patch('/generatelink/:projectId/:organizationId/:orderItemId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), generateOrderHistoryPDFController)

// notu in use
orderMaterialHistoryRoutes.delete('/delete/:projectId/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteOrderMaterialPdf)
// not in use
orderMaterialHistoryRoutes.patch('/upddatepdfstatus/:projectId/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updatePdfStatus)

// not in use
orderMaterialHistoryRoutes.get('/getpublic/:projectId', getPublicDetails)

orderMaterialHistoryRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updateDeliveryLocationDetails);
orderMaterialHistoryRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updateShopDetails);

orderMaterialHistoryRoutes.post("/:projectId/upload", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), imageUploadToS3.array("files"), processUploadFiles, uploadOrderMaterialImages);
orderMaterialHistoryRoutes.delete("/:projectId/deleteimage/:imageId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel),  deleteOrderingMaterialImage);

// Add a subItem to a specific unit of a project
orderMaterialHistoryRoutes.post("/:projectId/unit/:unitId/addsubitem", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), addSubItemToUnit);

// Delete a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.delete("/:projectId/unit/:unitId/deletesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteSubItemFromUnit);
orderMaterialHistoryRoutes.delete("/deleteallsubunits/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), deleteAllSubUnits);

// Update a subItem by subItemId inside a unit
orderMaterialHistoryRoutes.put("/:projectId/unit/:unitId/updatesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), updateSubItemInUnit);



//  used to submit the order
orderMaterialHistoryRoutes.put("/:projectId/submitorder", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), submitOrderMaterial);
orderMaterialHistoryRoutes.put("/:projectId/:orderItemId/:organizationId/senttoprocurement", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), placeOrderToProcurement);

orderMaterialHistoryRoutes.get("/:projectId/:orderItemId/getsingleorderedItem", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), getSingleOrderedItem);




orderMaterialHistoryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), orderMaterialHistoryCompletionStatus)
orderMaterialHistoryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), setOrderMaterialHistoryStageDeadline)



export default orderMaterialHistoryRoutes
