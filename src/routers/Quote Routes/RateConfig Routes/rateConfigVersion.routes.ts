import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getItemVersions } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfigVersion.controller";

const RateConfigVersionRoutes = Router();

RateConfigVersionRoutes.get("/get-all",  multiRoleAuthMiddleware("owner","CTO", "staff"), getItemVersions);

export default RateConfigVersionRoutes;
