import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { getEBLogs , getEBLogById,
createEBLog,
updateEBLog,
deleteEBLog, 
getEBPremisesAnalytics,
getEBDashboardOverview,
getEBConsumptionChart,
getEBDashboardBillKpis,} from "../../controllers/eb_controllers/ebLog.controller";


const ebLogsRoutes = Router();

// ============================
// GET ALL EB LOGS (with query filters)
// ============================
ebLogsRoutes.get(
    "/get-all/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBLogs
);

// ============================
// GET EB LOG BY ID
// ============================
ebLogsRoutes.get(
    "/get/:organizationId/:logId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBLogById
);

// ============================
// CREATE EB LOG
// ============================
ebLogsRoutes.post(
    "/create/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    createEBLog
);

// ============================
// UPDATE EB LOG
// ============================
ebLogsRoutes.put(
    "/update/:organizationId/:logId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    updateEBLog
);

// ============================
// DELETE EB LOG
// ============================
ebLogsRoutes.delete(
    "/delete/:organizationId/:logId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    deleteEBLog
);

// anlaytics routes starts from here 

ebLogsRoutes.get(
    "/analytics/:organizationId/premises",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBPremisesAnalytics
);




ebLogsRoutes.get(
    "/analytics/:organizationId/dashboard",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBDashboardOverview
);



ebLogsRoutes.get(
    "/analytics/:organizationId/line-chart/consumption",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBConsumptionChart
);

ebLogsRoutes.get(
    "/analytics/:organizationId/bill/kpi",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getEBDashboardBillKpis
);







export default ebLogsRoutes;