import { Router } from "express";
import { createMaterialCategory,   createMaterialItems,
  updateMaterialItem,
  deleteMaterialItem,
  deleteMaterialCategory,
  getMaterialCategories,
  getMaterialItemsByCategory, } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const RateConfigRoutes = Router();



RateConfigRoutes.get("/categories/:organizationId",  multiRoleAuthMiddleware("owner","CTO"), getMaterialCategories);
RateConfigRoutes.get("/categories/:categoryId/items", multiRoleAuthMiddleware("owner","CTO"),  getMaterialItemsByCategory);

/**
 * CATEGORY ROUTES
 */
// Create category (e.g., Plywood, Adhesive, etc.)
RateConfigRoutes.post("/categories", multiRoleAuthMiddleware("owner","CTO"), createMaterialCategory);

// Delete category and its items
RateConfigRoutes.delete("/categories/:categoryId",multiRoleAuthMiddleware("owner","CTO"), deleteMaterialCategory);

/**
 * ITEM ROUTES
 */
// Create items under a category
RateConfigRoutes.post("/categories/:organizationId/:categoryId/items", multiRoleAuthMiddleware("owner","CTO"),createMaterialItems);

// Update single item
RateConfigRoutes.put("/items/:itemId", multiRoleAuthMiddleware("owner","CTO"),updateMaterialItem);

// Delete single item
RateConfigRoutes.delete("/items/:itemId",multiRoleAuthMiddleware("owner","CTO"), deleteMaterialItem);

export default RateConfigRoutes;
