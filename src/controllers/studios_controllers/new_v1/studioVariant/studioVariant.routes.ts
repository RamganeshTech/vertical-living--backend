import { Router } from "express";
import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";
import { createStudioVariant, deleteStudioVariant, getStudioVariant, listStudioVariants, updateStudioVariant } from "./studioVariant.controller";

const StudentVariantRoutes = Router();
const allowed = multiRoleAuthMiddleware("owner", "staff", "CTO");

StudentVariantRoutes.post("/:organizationId/:studioId/create", allowed, createStudioVariant);
StudentVariantRoutes.get("/:organizationId", allowed, listStudioVariants);
StudentVariantRoutes.get("/:organizationId/:variantId", allowed, getStudioVariant);
StudentVariantRoutes.put("/:organizationId/:variantId", allowed, updateStudioVariant);
StudentVariantRoutes.delete("/:organizationId/:variantId", allowed, deleteStudioVariant);

export default StudentVariantRoutes;