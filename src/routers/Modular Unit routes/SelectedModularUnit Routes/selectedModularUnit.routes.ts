import express from "express";
import {  addSelectedUnit,
  getSelectedUnitsByProject,
  deleteSelectedUnit,
  completeModularUnitSelection, } from '../../../controllers/Modular Units Controllers/SelectedModularUnits Controllers/selectedModularUnit.controller';
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
 


const SelectedModularUnitRoutes = express.Router();

SelectedModularUnitRoutes.post("/add", multiRoleAuthMiddleware("owner", "CTO", "staff"), addSelectedUnit); // POST: { projectId,  unitId,  category,  quantity,  singleUnitCost }
SelectedModularUnitRoutes.get("/get/:projectId", multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getSelectedUnitsByProject); // GET: projectId from param
SelectedModularUnitRoutes.delete("/delete/:projectId/:unitId", multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteSelectedUnit); // DELETE: projectId + unitId
SelectedModularUnitRoutes.post("/projects/:projectId/modular-unit/complete",multiRoleAuthMiddleware("owner", "CTO", "staff"),completeModularUnitSelection);

export default SelectedModularUnitRoutes;
