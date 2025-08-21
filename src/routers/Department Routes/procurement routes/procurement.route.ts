import { Router } from "express";
import { getProcurementAllLogs, getProcurementLogsFiltered } from "../../../controllers/Department controllers/Procurement Controllers/procurement.controller";

const procurementRoutes = Router();

// Get all logs for an organization
procurementRoutes.get("/:organizationId", getProcurementAllLogs);

// Get filtered logs
procurementRoutes.get("/:organizationId/filter", getProcurementLogsFiltered);

export default procurementRoutes;
