// logistics.routes.ts
import express from "express";
import { createShipment,  deleteShipment,  getActiveShipmentsWithLocation,  getAllShipments,  getShipmentByToken,  getShipmentRouteHistory,  getSingleLogisticsShipment,  startTracking,  SyncAccountingFromLogistics,  updateDriverLocation,  updateShipment } from "../../../controllers/Department controllers/Logistics Controllers/logistics.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const LogisticsRoutes = express.Router();

// // Vehicle routes
// LogisticsRoutes.post("/vehicle/create/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"), createVehicle);
// LogisticsRoutes.put("/vehicle/update/:vehicleId/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateVehicle);
// LogisticsRoutes.delete("/vehicle/delete/:vehicleId/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteVehicle);
// LogisticsRoutes.get("/vehicle/getvehicle/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"), getOrganizationVehicles);

// Shipment routes
LogisticsRoutes.post("/shipment/create/:projectId/:organizationId/:projectName", multiRoleAuthMiddleware("owner", "CTO", "staff"), createShipment);
LogisticsRoutes.put("/shipment/update/:projectId/:organizationId/:shipmentId", multiRoleAuthMiddleware("owner", "CTO", "staff"), updateShipment);
LogisticsRoutes.delete("/shipment/delete/:organizationId/:shipmentId", multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteShipment);
LogisticsRoutes.get("/shipment/getshipment",  multiRoleAuthMiddleware("owner", "CTO", "staff"),getAllShipments);
LogisticsRoutes.get("/shipment/getsingle/:shipmentId",  multiRoleAuthMiddleware("owner", "CTO", "staff"),getSingleLogisticsShipment);


LogisticsRoutes.post('/shipment/:shipmentId/update-location', updateDriverLocation);
LogisticsRoutes.post('/shipment/:shipmentId/start-tracking', startTracking);
LogisticsRoutes.get('/shipment/active-with-location',multiRoleAuthMiddleware("owner", "CTO", "staff"), getActiveShipmentsWithLocation);
LogisticsRoutes.get('/shipment/:shipmentId/route-history',multiRoleAuthMiddleware("owner", "CTO", "staff"), getShipmentRouteHistory);
LogisticsRoutes.get('/shipment/getpublic/:token', getShipmentByToken);


LogisticsRoutes.post(
  "/syncaccounting/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  SyncAccountingFromLogistics

);

export default LogisticsRoutes;