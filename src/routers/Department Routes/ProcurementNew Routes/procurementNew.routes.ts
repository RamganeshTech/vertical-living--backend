// logistics.routes.ts
import express from "express";
import { createShipment,  deleteShipment,  getAllShipments,  getSingleLogisticsShipment,  updateShipment } from "../../../controllers/Department controllers/Logistics Controllers/logistics.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deleteprocurement, deleteProcurementPdf, generateProcurementPDFController, getProcurementNewDetails, getProcurementNewSingleItem, syncLogisticsDept, updateProcurementDeliveryLocationDetails, updateProcurementShopDetails, updateProcurementTotalCost } from "../../../controllers/Department controllers/ProcurementNew Controllers/procurementNew.controller";

const procurementNewRoutes = express.Router();

procurementNewRoutes.put("/updateshop/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProcurementShopDetails);
procurementNewRoutes.put("/updatedelivery/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProcurementDeliveryLocationDetails);
procurementNewRoutes.delete("/deleteprocurement/:id", multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteprocurement);
procurementNewRoutes.get("/getprocurementall",  multiRoleAuthMiddleware("owner", "CTO", "staff"),getProcurementNewDetails);
procurementNewRoutes.put("/updatetotalcost/:id",  multiRoleAuthMiddleware("owner", "CTO", "staff"),updateProcurementTotalCost);
procurementNewRoutes.get("/getprocurementsingle/:id",  multiRoleAuthMiddleware("owner", "CTO", "staff"), getProcurementNewSingleItem);
procurementNewRoutes.patch("/generatepdf/:id",  multiRoleAuthMiddleware("owner", "CTO", "staff"), generateProcurementPDFController);

procurementNewRoutes.delete('/deletepdf/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   deleteProcurementPdf)
procurementNewRoutes.post('/synclogistics/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",),   syncLogisticsDept)



export default procurementNewRoutes;