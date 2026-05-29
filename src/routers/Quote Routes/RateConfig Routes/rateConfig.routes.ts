import { Router } from "express";
import { createMaterialCategory,   createMaterialItems,
  updateMaterialItem,
  deleteMaterialItem,
  deleteMaterialCategory,
  getMaterialCategories,
  getMaterialItemsByCategory,
  getMaterialItemsForFittings,
  updateMaterialCategoryAndSyncItems,
  getMaterialItemsForallCategories,
  updateCategoryDescriptions,
  updateMaterialCategoryAndSyncItemsV2,
  getMaterialCategoriesPreSales,
  getMaterialCategoriesInternalQuote, } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";

const RateConfigRoutes = Router();


// helper routes
//  not used (used to give all the items in single category based on the value we are passing eg: ?categoryName="plywood")
RateConfigRoutes.get("/categories/fittings/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialItemsForFittings);
//  not used
RateConfigRoutes.get("/categories/all/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialItemsForallCategories);

RateConfigRoutes.put("/categories/:categoryId/description", multiRoleAuthMiddleware("owner","CTO", "staff"),  updateCategoryDescriptions);





/**
 * CATEGORY ROUTES
*/
RateConfigRoutes.get("/categories/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialCategories);
RateConfigRoutes.get("/categories/v1/presales/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialCategoriesPreSales);
RateConfigRoutes.get("/categories/v1/internalquote/:organizationId",  multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterialCategoriesInternalQuote);
// Create category (e.g., Plywood, Adhesive, etc.)
RateConfigRoutes.post("/categories", multiRoleAuthMiddleware("owner","CTO", "staff"), createMaterialCategory);
RateConfigRoutes.put("/categories/update/:organizationId/:categoryId", multiRoleAuthMiddleware("owner","CTO", "staff"), updateMaterialCategoryAndSyncItemsV2);

// Delete category and its items
RateConfigRoutes.delete("/categories/:categoryId",multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterialCategory);

/**
 * ITEM ROUTES
 */
// Create items under a category
RateConfigRoutes.get("/categories/:categoryId/items", multiRoleAuthMiddleware("owner","CTO", "staff"),  getMaterialItemsByCategory);

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
