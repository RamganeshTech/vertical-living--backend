import { Router } from "express";
import { assignStageStaffByName } from "../../../controllers/stage controllers/Assign Staff Controller/assignStaffs.controllers"; 
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

// ✅ If you have a middleware for role checking, use it here
// import multiRoleAuthMiddleware from "../middleware/multiRoleAuth";

const assignRoutes = Router();

// ✅ put => Assign staff to a stage by stage name
assignRoutes.put("/:projectId/:staffId/:stageName",
  multiRoleAuthMiddleware("CTO", "owner", "staff"), 
  assignStageStaffByName
);

export default assignRoutes;
