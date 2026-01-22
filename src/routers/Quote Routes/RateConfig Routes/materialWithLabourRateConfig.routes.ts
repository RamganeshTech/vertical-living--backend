import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

import { 
    createMaterailWithLabourCategory,
   createMaterailWithLabourItems,
  updateMaterailWithLabourItem,
  deleteMaterailWithLabourItem,
  deleteMaterailWithLabourCategory,
  getMaterailWithLabourCategories,
  getMaterailWithLabourItemsByCategory,
  getSingleMaterailWithLabourRateConfigCost,
  getMaterailWithLabourSalaryByCategoryName, 
 } from "../../../controllers/Quote Controllers/RateConfig Controller/materialWithLabourRateConfig.controller";

const MateroialWithLabourRateConfigRoutes = Router();


MateroialWithLabourRateConfigRoutes.get("/categories/:organizationId", 
     multiRoleAuthMiddleware("owner","CTO", "staff"),getMaterailWithLabourCategories);
MateroialWithLabourRateConfigRoutes.get("/categories/:organizationId/:categoryId/items", 
    multiRoleAuthMiddleware("owner","CTO", "staff"),  getMaterailWithLabourItemsByCategory);

//  old version of getting salary of single person by category Id
//  used in the quotes
MateroialWithLabourRateConfigRoutes.get("/categories/:organizationId/singlesalary/:categoryId",
     multiRoleAuthMiddleware("owner","CTO", "staff"),  getSingleMaterailWithLabourRateConfigCost);

//  new version of getting salary of single person by category name 
MateroialWithLabourRateConfigRoutes.get("/categories/:organizationId/singlesalary",  
    multiRoleAuthMiddleware("owner","CTO", "staff"), getMaterailWithLabourSalaryByCategoryName);
/**
 * CATEGORY ROUTES
 */
MateroialWithLabourRateConfigRoutes.post("/categories", 
    multiRoleAuthMiddleware("owner","CTO", "staff"), createMaterailWithLabourCategory);

MateroialWithLabourRateConfigRoutes.delete("/categories/:categoryId",
    multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterailWithLabourCategory);

/**
 * ITEM ROUTES
 */
MateroialWithLabourRateConfigRoutes.post("/categories/:organizationId/:categoryId/items", 
    multiRoleAuthMiddleware("owner","CTO", "staff"),createMaterailWithLabourItems);

MateroialWithLabourRateConfigRoutes.put("/items/:itemId", 
    multiRoleAuthMiddleware("owner","CTO", "staff"),updateMaterailWithLabourItem);

MateroialWithLabourRateConfigRoutes.delete("/items/:itemId",
    multiRoleAuthMiddleware("owner","CTO", "staff"), deleteMaterailWithLabourItem);

export default MateroialWithLabourRateConfigRoutes;
