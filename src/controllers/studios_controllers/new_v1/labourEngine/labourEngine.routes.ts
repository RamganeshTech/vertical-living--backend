// labourEngine.routes.ts
/**
 * Mounted inside the Studio routes as /api/studios/:organizationId/labour-engine, so no change is needed in
 * the app's route list. Must be mounted before "/:organizationId/:studioId".
 */
import { Router } from "express";
import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";
import { getLabourEngineHistory, getLabourEngineSettings, saveLabourEngineSettings } from "./labourEngine.controller";

/** Answer G2: owner, CTO and staff may read and edit the Labour Engine settings. */
const labourEngineRoles = multiRoleAuthMiddleware("owner", "staff", "CTO");

const LabourEngineRoutes = Router({ mergeParams: true });

LabourEngineRoutes.get("/", labourEngineRoles, getLabourEngineSettings);
LabourEngineRoutes.put("/", labourEngineRoles, saveLabourEngineSettings);
LabourEngineRoutes.get("/history", labourEngineRoles, getLabourEngineHistory);
// LabourEngineRoutes.get("/history/:version", labourEngineRoles, getLabourEngineVersion);

export default LabourEngineRoutes;
