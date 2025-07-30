import express from "express";
import {  addSelectedUnit,
  getSelectedUnitsByProject,
  deleteSelectedUnit,
  completeModularUnitSelection, } from '../../../controllers/Modular Units Controllers/SelectedModularUnits Controllers/selectedModularUnit.controller';
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
// import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
import { SelectedModularUnitModel } from "../../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
 


const SelectedModularUnitRoutes = express.Router();

SelectedModularUnitRoutes.post("/:projectId/add", multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(SelectedModularUnitModel), addSelectedUnit); // POST: { projectId,  unitId,  category,  quantity,  singleUnitCost }
SelectedModularUnitRoutes.get("/get/:projectId", multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getSelectedUnitsByProject); // GET: projectId from param
SelectedModularUnitRoutes.delete("/delete/:projectId/:unitId", multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(SelectedModularUnitModel), deleteSelectedUnit); // DELETE: projectId + unitId
SelectedModularUnitRoutes.post("/projects/:projectId/modular-unit/complete",multiRoleAuthMiddleware("owner", "CTO", "staff"),checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(SelectedModularUnitModel),completeModularUnitSelection);

export default SelectedModularUnitRoutes;
