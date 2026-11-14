import { Router } from "express";
import {
  createHub,
  getHubs,
  getHubById,
  updateHub,
  deleteHub,
  toggleHubStatus,
  findHubByLocation,
  importHubsFromExcel,
} from "./hub.controller"; // adjust path as needed
import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";
import { excelUpload } from "../../../../middlewares/uploadExcel.middleware";

const hubRoutes = Router();

hubRoutes.post("/", multiRoleAuthMiddleware("owner", "CTO", "staff"), createHub);
hubRoutes.get("/find",multiRoleAuthMiddleware("owner", "CTO", "staff"), findHubByLocation);
hubRoutes.get("/organization/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff"),  getHubs);
hubRoutes.get("/:hubId",  multiRoleAuthMiddleware("owner", "CTO", "staff"), getHubById);
hubRoutes.put("/:hubId", multiRoleAuthMiddleware("owner", "CTO", "staff"),  updateHub);
hubRoutes.delete("/:hubId",  multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteHub);
hubRoutes.patch("/:hubId/toggle-status", multiRoleAuthMiddleware("owner", "CTO", "staff"),  toggleHubStatus);

hubRoutes.post("/organization/:organizationId/import",  excelUpload.single("file"), importHubsFromExcel);

export default hubRoutes;