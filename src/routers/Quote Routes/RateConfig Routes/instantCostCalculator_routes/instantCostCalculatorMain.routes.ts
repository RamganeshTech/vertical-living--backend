// routes/instantCostMain.routes.ts
import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";
import { getCostCalculatorMain, upsertCostCalculatorMain } from "../../../../controllers/Quote Controllers/RateConfig Controller/instant_costCalculator_controller/instantCostCalculatorMain.controller";
// import { getCostCalculatorProduct, upsertCostCalculatorProduct } from "../controllers/categoryController";
// import { multiRoleAuthMiddleware } from "../middleware/authMiddleware"; // Adjust path

const InstantCostCalculatorMainRoute = Router();

// GET configuration for a specific organization
InstantCostCalculatorMainRoute.get("/getsingle/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"), getCostCalculatorMain);

// POST upsert configuration
InstantCostCalculatorMainRoute.post("/upsert", multiRoleAuthMiddleware("owner", "CTO", "staff"), upsertCostCalculatorMain);

export default InstantCostCalculatorMainRoute;