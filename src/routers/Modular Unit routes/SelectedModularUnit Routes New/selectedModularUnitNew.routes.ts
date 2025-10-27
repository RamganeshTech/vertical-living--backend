import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { addSelectedUnitNew, completeModularUnitSelection, deleteSelectedUnitNew, getSelectedUnitsByProjectNew } from "../../../controllers/Modular Units Controllers/SelectedModularUnitsNew  Controllers/selectedModularUnitNew.controller";
// import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
 




const SelectedModularUnitNewRoutes = express.Router();

SelectedModularUnitNewRoutes.post("/:projectId/add", multiRoleAuthMiddleware("owner", "CTO", "staff"),  addSelectedUnitNew); // POST: { projectId,  unitId,  category,  quantity,  singleUnitCost }
SelectedModularUnitNewRoutes.get("/get/:projectId", multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getSelectedUnitsByProjectNew); // GET: projectId from param
SelectedModularUnitNewRoutes.delete("/delete/:projectId/:unitId", multiRoleAuthMiddleware("owner", "CTO", "staff"),  deleteSelectedUnitNew); // DELETE: projectId + unitId
SelectedModularUnitNewRoutes.post("/projects/:projectId/modular-unit/complete",multiRoleAuthMiddleware("owner", "CTO", "staff"),completeModularUnitSelection);

export default SelectedModularUnitNewRoutes;
