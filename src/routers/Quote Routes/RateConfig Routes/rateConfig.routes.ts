import { Router } from "express";
import { createMaterialCategory,   createMaterialItems,
  updateMaterialItem,
  deleteMaterialItem,
  deleteMaterialCategory,
  getMaterialCategories,
  getMaterialItemsByCategory,
  getMaterialItemsForFittings, } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const RateConfigRoutes = Router();



RateConfigRoutes.get("/categories/fittings",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialItemsForFittings);

RateConfigRoutes.get("/categories/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialCategories);
RateConfigRoutes.get("/categories/:categoryId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),  getMaterialItemsByCategory);

/**
 * CATEGORY ROUTES
 */
// Create category (e.g., Plywood, Adhesive, etc.)
RateConfigRoutes.post("/categories", multiRoleAuthMiddleware("owner","CTO", "staff"), createMaterialCategory);

// Delete category and its items
RateConfigRoutes.delete("/categories/:categoryId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterialCategory);

/**
 * ITEM ROUTES
 */
// Create items under a category
RateConfigRoutes.post("/categories/:organizationId/:categoryId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),createMaterialItems);

// Update single item
RateConfigRoutes.put("/items/:itemId", multiRoleAuthMiddleware("owner","CTO", "staff"),updateMaterialItem);

// Delete single item
RateConfigRoutes.delete("/items/:itemId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterialItem);

export default RateConfigRoutes;
