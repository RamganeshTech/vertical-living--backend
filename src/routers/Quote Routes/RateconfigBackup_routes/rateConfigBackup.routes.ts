import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getRateConfigBackups, getSingleRateConfigBackup, restoreFromBackup } from "../../../controllers/Quote Controllers/RateconfigBackup_controllers/rateConfigBackup.controller";



const RateConfigBackupRoutes = Router();

//  old version of getting salary of single person by category Id
//  used in the quotes
RateConfigBackupRoutes.get("/get-all", multiRoleAuthMiddleware("owner","CTO", "staff"),  getRateConfigBackups);
RateConfigBackupRoutes.put("/restore/:organizationId/:backupId", multiRoleAuthMiddleware("owner","CTO", "staff"),  restoreFromBackup);
RateConfigBackupRoutes.get("/single/:backupId", multiRoleAuthMiddleware("owner","CTO", "staff"), getSingleRateConfigBackup);

export default RateConfigBackupRoutes;
