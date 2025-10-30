import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createShopLib,
  updateShopLib,
  getShopLib,
  deleteShopLib, } from "../../../controllers/stage controllers/ordering material controller/shopLibOrderMaterail.controller";

const shopLibRoutes = express.Router();

shopLibRoutes.post(
  "/:organizationId/create",
  multiRoleAuthMiddleware("owner", "staff", "CTO", ),
  createShopLib
);

shopLibRoutes.put(
  "/:id/update",
  multiRoleAuthMiddleware("owner", "staff", "CTO" ),
  updateShopLib
);

shopLibRoutes.get(
  "/:organizationId/get",
//   multiRoleAuthMiddleware("owner", "staff", "CTO", "worker" ),
  getShopLib
);

shopLibRoutes.delete(
  "/:id/delete",
  multiRoleAuthMiddleware("owner", "staff", "CTO", ),
  deleteShopLib
);

export default shopLibRoutes;
