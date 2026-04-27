import { Router } from "express";
// import { 
//     upsertCostCalculatorProduct, 
//     getCostCalculatorProduct 
// } from "../controllers/instantCostProductController"; // Adjust path
// import { multiRoleAuthMiddleware } from "../middlewares/authMiddleware"; // Adjust path
import { getCategoryDimensions, getCostCalculatorProduct, getProductSpecificCategories, upsertCostCalculatorProduct } from "../../../../controllers/Quote Controllers/RateConfig Controller/instant_costCalculator_controller/instantCostCalculatorRecord.controller";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";

const InstantCostCalculatorProductRoute = Router();


InstantCostCalculatorProductRoute.get(
    "/get-all-category/:organizationId",
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    getProductSpecificCategories
);

InstantCostCalculatorProductRoute.get(
    "/get-all-dimentions/:organizationId/:categoryId",
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    getCategoryDimensions
);


/**
 * @route   GET /api/quote/instantcostcalculator/:organizationId/:categoryId/:dimensionKey
 * @desc    Fetch specific configuration by org, category and dimension string
 * @access  Owner, CTO, Staff
 */
InstantCostCalculatorProductRoute.get(
    "/get-single/:organizationId/:categoryId/:dimensionKey",
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    getCostCalculatorProduct
);


/**
 * @route   POST /api/quote/instantcostcalculator/upsert
 * @desc    Create or Update a product configuration for a specific dimension
 * @access  Owner, CTO, Staff
 */
InstantCostCalculatorProductRoute.post(
    "/upsert",
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    upsertCostCalculatorProduct
);





export default InstantCostCalculatorProductRoute;