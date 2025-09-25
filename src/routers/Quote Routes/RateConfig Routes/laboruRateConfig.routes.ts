import { Router } from "express";
import { createLabourCategory,   createLabourItems,
  updateLabourItem,
  deleteLabourItem,
  deleteLabourCategory,
  getLabourCategories,
  getLabourItemsByCategory,
  getSingleLabourRateConfigCost, } from "../../../controllers/Quote Controllers/RateConfig Controller/labourRateConfig.controllers";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";



const LabourRateConfigRoutes = Router();



LabourRateConfigRoutes.get("/categories/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getLabourCategories);
LabourRateConfigRoutes.get("/categories/:organizationId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),  getLabourItemsByCategory);
LabourRateConfigRoutes.get("/categories/:organizationId/singlesalary", multiRoleAuthMiddleware("owner","CTO", "staff"),  getSingleLabourRateConfigCost);

/**
 * CATEGORY ROUTES
 */
// Create category (e.g., Plywood, Adhesive, etc.)
LabourRateConfigRoutes.post("/categories", multiRoleAuthMiddleware("owner","CTO", "staff"), createLabourCategory);

// Delete category and its items
LabourRateConfigRoutes.delete("/categories/:categoryId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteLabourCategory);

/**
 * ITEM ROUTES
 */
// Create items under a category
LabourRateConfigRoutes.post("/categories/:organizationId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),createLabourItems);

// Update single item
LabourRateConfigRoutes.put("/items/:itemId", multiRoleAuthMiddleware("owner","CTO", "staff"),updateLabourItem);

// Delete single item
LabourRateConfigRoutes.delete("/items/:itemId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteLabourItem);

export default LabourRateConfigRoutes;
