import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createInventorySubItem, deleteInventorySubItem, getInventoryDetails, updateInventorySubItem } from "../../../controllers/stage controllers/Inventory controllers/inventory.controller";

const InventoryRoutes = express.Router();

// ✅ Create subitem
InventoryRoutes.post(
  "/create/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  createInventorySubItem
);

// ✅ Update subitem
InventoryRoutes.put(
  "/update/:projectId/:subItemId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateInventorySubItem
);

// ✅ Delete subitem
InventoryRoutes.delete(
  "/delete/:projectId/:subItemId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteInventorySubItem
);

// ✅ Get all inventory details
InventoryRoutes.get(
  "/get/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
  getInventoryDetails
);

export default InventoryRoutes;
