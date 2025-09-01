import express from "express";
import { getGlobalMaterials, getProjectMaterials, updateRecycleMaterialManually, updateRecycleQuantity } from "../../../../controllers/stage controllers/Inventory controllers/Recycle Controllers/recycle.controllers";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";

const recycleMaterialRoutes = express.Router();



// ✅ Get all inventory details
recycleMaterialRoutes.put(
  "/updaterecyclemanually/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateRecycleMaterialManually
);



// ✅ Get all inventory details
recycleMaterialRoutes.patch(
  "/updatequantity/:organizationId/:projectId/:itemId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateRecycleQuantity
);


// ✅ Get all inventory details
recycleMaterialRoutes.get(
  "/getglobalmaterials/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
  getGlobalMaterials
);


// ✅ Get all inventory details
recycleMaterialRoutes.get(
  "/getsingleprojectmaterial/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
   getProjectMaterials
);

export default recycleMaterialRoutes;
