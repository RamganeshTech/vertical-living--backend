// import { Router } from "express";
// import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";
// import { createStudioVariant, createStudioVariantShareLink, deleteStudioVariant, getSharedStudioVariant, getStudioVariant, listStudioVariants, revokeStudioVariantShareLink, updateStudioVariant } from "./studioVariant.controller";

// const StudentVariantRoutes = Router();
// const allowed = multiRoleAuthMiddleware("owner", "staff", "CTO");

// StudentVariantRoutes.get("/shared/:token", getSharedStudioVariant);


// StudentVariantRoutes.post("/:organizationId/:studioId/create", allowed, createStudioVariant);
// StudentVariantRoutes.get("/:organizationId", allowed, listStudioVariants);
// StudentVariantRoutes.get("/:organizationId/:variantId", allowed, getStudioVariant);
// StudentVariantRoutes.get("/:organizationId/:variantId", getStudioVariant);
// StudentVariantRoutes.put("/:organizationId/:variantId", allowed, updateStudioVariant);
// StudentVariantRoutes.delete("/:organizationId/:variantId", allowed, deleteStudioVariant);


// StudentVariantRoutes.post("/:organizationId/:variantId/share-links", allowed, createStudioVariantShareLink);
// StudentVariantRoutes.delete("/:organizationId/:variantId/share-links/:shareLinkId", allowed, revokeStudioVariantShareLink);


// export default StudentVariantRoutes;


//  md sir version


import { Router } from "express";
import { multiRoleAuthMiddleware } from "../studio/studio.crmImports";
import { createStudioVariant, createStudioVariantShareLink, deleteStudioVariant, getSharedStudioVariant, getStudioVariant, listStudioVariants, revokeStudioVariantShareLink, updateStudioVariant } from "./studioVariant.controller";
//////////////////////////////CHANGES STARTED////////////////////////////
import { StudioVariantInternalQuoteRoutes } from "../studio/studioInternalQuote.controller";
///////////////////////////////CHAGNES ENDED////////////////////////////////////

const StudentVariantRoutes = Router();
const allowed = multiRoleAuthMiddleware("owner", "staff", "CTO");

StudentVariantRoutes.get("/shared/:token", getSharedStudioVariant);


StudentVariantRoutes.post("/:organizationId/:studioId/create", allowed, createStudioVariant);
StudentVariantRoutes.get("/:organizationId", allowed, listStudioVariants);
StudentVariantRoutes.get("/:organizationId/:variantId", allowed, getStudioVariant);
StudentVariantRoutes.get("/:organizationId/:variantId", getStudioVariant);
StudentVariantRoutes.put("/:organizationId/:variantId", allowed, updateStudioVariant);
StudentVariantRoutes.delete("/:organizationId/:variantId", allowed, deleteStudioVariant);


StudentVariantRoutes.post("/:organizationId/:variantId/share-links", allowed, createStudioVariantShareLink);
StudentVariantRoutes.delete("/:organizationId/:variantId/share-links/:shareLinkId", allowed, revokeStudioVariantShareLink);

//////////////////////////////CHANGES STARTED////////////////////////////
// Variation -> internal quote (client studio single page): GET preview, POST create. Same rules as the studio's.
StudentVariantRoutes.use("/:organizationId/:variantId/internal-quote", StudioVariantInternalQuoteRoutes);
///////////////////////////////CHAGNES ENDED////////////////////////////////////


export default StudentVariantRoutes;