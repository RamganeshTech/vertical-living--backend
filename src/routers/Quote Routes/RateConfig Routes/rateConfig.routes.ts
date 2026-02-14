import { Router } from "express";
import { createMaterialCategory,   createMaterialItems,
  updateMaterialItem,
  deleteMaterialItem,
  deleteMaterialCategory,
  getMaterialCategories,
  getMaterialItemsByCategory,
  getMaterialItemsForFittings,
  updateMaterialCategoryAndSyncItems,
  getMaterialItemsForallCategories, } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";

const RateConfigRoutes = Router();



RateConfigRoutes.get("/categories/fittings/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialItemsForFittings);
RateConfigRoutes.get("/categories/all/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialItemsForallCategories);

RateConfigRoutes.get("/categories/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialCategories);
RateConfigRoutes.get("/categories/:categoryId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),  getMaterialItemsByCategory);

/**
 * CATEGORY ROUTES
 */
// Create category (e.g., Plywood, Adhesive, etc.)
RateConfigRoutes.post("/categories", multiRoleAuthMiddleware("owner","CTO", "staff"), createMaterialCategory);
RateConfigRoutes.put("/categories/update/:organizationId/:categoryId", multiRoleAuthMiddleware("owner","CTO", "staff"), updateMaterialCategoryAndSyncItems);

// Delete category and its items
RateConfigRoutes.delete("/categories/:categoryId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterialCategory);

/**
 * ITEM ROUTES
 */
// Create items under a category
RateConfigRoutes.post("/categories/:organizationId/:categoryId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),
imageUploadToS3.any(), processUploadFiles,
createMaterialItems);

// Update single item
RateConfigRoutes.put("/items/:itemId", multiRoleAuthMiddleware("owner","CTO", "staff"),
imageUploadToS3.any(), processUploadFiles,
updateMaterialItem);

// Delete single item
RateConfigRoutes.delete("/items/:itemId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterialItem);

export default RateConfigRoutes;
