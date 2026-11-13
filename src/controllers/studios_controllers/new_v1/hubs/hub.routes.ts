import { Router } from "express";
import {
  createHub,
  getHubs,
  getHubById,
  updateHub,
  deleteHub,
  toggleHubStatus,
  findHubByLocation,
} from "./hub.controller"; // adjust path as needed
import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";

const hubRoutes = Router();

hubRoutes.post("/", multiRoleAuthMiddleware("owner", "CTO", "staff"), createHub);
hubRoutes.get("/find",multiRoleAuthMiddleware("owner", "CTO", "staff"), findHubByLocation);
hubRoutes.get("/organization/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"),  getHubs);
hubRoutes.get("/:hubId",  multiRoleAuthMiddleware("owner", "CTO", "staff"), getHubById);
hubRoutes.put("/:hubId", multiRoleAuthMiddleware("owner", "CTO", "staff"),  updateHub);
hubRoutes.delete("/:hubId",  multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteHub);
hubRoutes.patch("/:hubId/toggle-status", multiRoleAuthMiddleware("owner", "CTO", "staff"),  toggleHubStatus);

export default hubRoutes;