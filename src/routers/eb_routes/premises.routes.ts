import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { createPremises, deletePremises, getPremises, getPremisesById, updatePremises } from "../../controllers/eb_controllers/premises.controller";


const premisesRoutes = Router();

// Reusable roles array excluding "teacher"

// ============================ 
// GET ALL PREMISES
// ============================
premisesRoutes.get(
    "/get/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getPremises
);


premisesRoutes.get(
    "/get-single/:premisesId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getPremisesById
);

// ============================   
// CREATE PREMISES
// ============================
premisesRoutes.post(
    "/create/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    createPremises
);

// ============================
// UPDATE PREMISES
// ============================
premisesRoutes.put(
    "/update/:organizationId/:premisesId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    updatePremises
);

// ============================
// DELETE PREMISES
// ============================
premisesRoutes.delete(
    "/delete/:organizationId/:premisesId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    deletePremises
);

export default premisesRoutes;