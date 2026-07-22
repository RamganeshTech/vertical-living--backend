import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { getTariffs, getTariffById,
 createTariff,
 updateTariff,
 deleteTariff  } from "../../controllers/eb_controllers/tariff.controller";

const tariffRoutes = Router();

// ============================
// GET ALL TARIFFS
// ============================   
tariffRoutes.get(
    "/get-all/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getTariffs
);

// ============================
// GET TARIFF BY ID
// ============================
tariffRoutes.get(
    "/get/:organizationId/:tariffId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    getTariffById
);

// ============================
// CREATE TARIFF
// ============================
tariffRoutes.post(
    "/create/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    createTariff
);

// ============================
// UPDATE TARIFF
// ============================
tariffRoutes.put(
    "/update/:organizationId/:tariffId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    updateTariff
);

// ============================
// DELETE TARIFF
// ============================
tariffRoutes.delete(
    "/delete/:organizationId/:tariffId",
    multiRoleAuthMiddleware("owner", "staff", "CTO",),
    deleteTariff
);

export default tariffRoutes;