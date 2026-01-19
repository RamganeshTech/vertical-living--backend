// logistics.routes.ts
import express from "express";
import { createShipment, deleteShipment, getAllShipments, getSingleLogisticsShipment, updateShipment } from "../../../controllers/Department controllers/Logistics Controllers/logistics.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import {  cancelAutomatedProcurementJob, confirmFinalShopQuote, createProcurementOrder, deleteprocurement, deleteProcurementPdf, generateProcurementPDFController, generateSecureProcurementLink, getOrderMaterialRefPdfDetails, getProcurementItemsPublic, getProcurementNewDetails, getProcurementNewSingleItem, sendProcurementToPayment, syncLogisticsDept, updateProcurementDeliveryLocationDetails, updateProcurementItemRate, updateProcurementShopDetails, updateProcurementSingleItemRate, updateProcurementSingleItemRatev1, updateProcurementTotalCost } from "../../../controllers/Department controllers/ProcurementNew Controllers/procurementNew.controller";

const procurementNewRoutes = express.Router();

procurementNewRoutes.put("/updateshop/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProcurementShopDetails);
procurementNewRoutes.put("/updatedelivery/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProcurementDeliveryLocationDetails);
procurementNewRoutes.delete("/deleteprocurement/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteprocurement);
procurementNewRoutes.get("/getprocurementall", multiRoleAuthMiddleware("owner", "CTO", "staff"), getProcurementNewDetails);
// not in use
// procurementNewRoutes.put("/updatetotalcost/:id",  multiRoleAuthMiddleware("owner", "CTO", "staff"),updateProcurementTotalCost);

procurementNewRoutes.get("/getprocurementsingle/:id", getProcurementNewSingleItem);
procurementNewRoutes.patch("/generatepdf/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), generateProcurementPDFController);

procurementNewRoutes.delete('/deletepdf/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), deleteProcurementPdf)
procurementNewRoutes.post('/generatetoken/:orderId', multiRoleAuthMiddleware("owner", "staff", "CTO",), generateSecureProcurementLink)

// not used below one
procurementNewRoutes.put('/public/updaterate', updateProcurementItemRate)

procurementNewRoutes.get('/public/get', getProcurementItemsPublic)
procurementNewRoutes.put("/public/item/update", updateProcurementSingleItemRate);

//  new version
procurementNewRoutes.put("/v1/public/item/update", updateProcurementSingleItemRatev1);
procurementNewRoutes.put("/confirmquote/:id/:quoteId", multiRoleAuthMiddleware("owner", "staff", "CTO",), confirmFinalShopQuote);



procurementNewRoutes.post('/synctopayments/:procurementId', multiRoleAuthMiddleware("owner", "staff", "CTO",), sendProcurementToPayment)
procurementNewRoutes.post('/cancelautomation/:procurementId', multiRoleAuthMiddleware("owner", "staff", "CTO",), cancelAutomatedProcurementJob)

procurementNewRoutes.post('/create', multiRoleAuthMiddleware("owner", "staff", "CTO",), createProcurementOrder)
procurementNewRoutes.get('/getordermaterial/fromdeptnumbers/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), getOrderMaterialRefPdfDetails)
// procurementNewRoutes.post('/synclogistics/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), syncLogisticsDept)
// procurementNewRoutes.post(
//   "/syncaccounting/:organizationId/:projectId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   SyncAccountingFromProcurement);

export default procurementNewRoutes;