import express from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { updateProfile } from "../../controllers/Profile Role Controllers/updateProfileRole.controller";

const profileRoutes = express.Router();

profileRoutes.put("/update-profile", multiRoleAuthMiddleware("owner", "worker", "staff", "client", "CTO"), updateProfile);

export default profileRoutes;
