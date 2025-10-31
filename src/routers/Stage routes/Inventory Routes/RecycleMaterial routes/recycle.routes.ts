import express from "express";
import { getGlobalMaterials, getProjectMaterials, updateRecycleMaterialManually, updateRecycleQuantity } from "../../../../controllers/stage controllers/Inventory controllers/Recycle Controllers/recycle.controllers";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";

const recycleMaterialRoutes = express.Router();



recycleMaterialRoutes.put(
  "/updaterecyclemanually/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateRecycleMaterialManually
);



recycleMaterialRoutes.patch(
  "/updatequantity/:organizationId/:projectId/:itemId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateRecycleQuantity
);


recycleMaterialRoutes.get(
  "/getglobalmaterials/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
  getGlobalMaterials
);


recycleMaterialRoutes.get(
  "/getsingleprojectmaterial/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
   getProjectMaterials
);

export default recycleMaterialRoutes;
