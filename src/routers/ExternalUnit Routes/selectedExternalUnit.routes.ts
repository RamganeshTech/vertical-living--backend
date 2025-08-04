// routes/selectedExternal.routes.ts
import express from "express";
import { addToSelectedExternal, deleteSelectedExternalUnit, getSelectedExternal, updateSelectedExternalStatus } from "../../controllers/ExternalUnit Controller/SelectedExternalUnits.controller";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";

const selectedExternalRoutes = express.Router();

// 🔁 Add a selected unit (single object) to a project
selectedExternalRoutes.post("/:projectId/addtoselected", multiRoleAuthMiddleware("staff", "owner", "CTO"), addToSelectedExternal);

// 🔎 Get all selected units for a project
selectedExternalRoutes.get("/:projectId/getselected",  getSelectedExternal);

// ❌ Delete a single selected unit from a project
selectedExternalRoutes.delete("/:projectId/:unitId/deleteselected", multiRoleAuthMiddleware("staff", "owner", "CTO"), deleteSelectedExternalUnit);

selectedExternalRoutes.patch("/:projectId/status", updateSelectedExternalStatus);


export default selectedExternalRoutes;
