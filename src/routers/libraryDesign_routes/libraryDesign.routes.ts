import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";
import { deleteLibraryDesign, getAllLibraryDesigns, getLibraryDesignById, getLibraryDesignsForDropdown, uploadLibraryDesigns } from "../../controllers/libraryDesign_controller/libraryDesign.controller";
// import { imageUploadToS3 } from "../middleware/imageUpload"; // ADJUST: your existing S3 upload middleware
// import { processUploadFiles } from "../middleware/processUploadFiles"; // ADJUST: your existing middleware
// import {
//   uploadLibraryDesigns,
//   getAllLibraryDesigns,
//   getLibraryDesignById,
//   deleteLibraryDesign,
// } from "./librarydesign.controller";

const PRICING_ROLES = ["owner", "staff", "CTO"]
const NETWORK_READ_ROLES = ["owner", "staff", "CTO"]

const pricingRoles = multiRoleAuthMiddleware(...PRICING_ROLES);
const readRoles = multiRoleAuthMiddleware(...NETWORK_READ_ROLES);

const LibraryDesignRoutes = Router()
// "upload" before "/:designId" so it is never read as a design id.
LibraryDesignRoutes.post(
  "/:organizationId/library/upload",
  pricingRoles,
  imageUploadToS3.array("files", 50),
  processUploadFiles,
  uploadLibraryDesigns
);
LibraryDesignRoutes.get("/:organizationId/library/dropdown", readRoles, getLibraryDesignsForDropdown);

LibraryDesignRoutes.get("/:organizationId/library", readRoles, getAllLibraryDesigns);
LibraryDesignRoutes.get("/:organizationId/library/:designId", readRoles, getLibraryDesignById);
LibraryDesignRoutes.delete("/:organizationId/library/:designId", pricingRoles, deleteLibraryDesign);


export default LibraryDesignRoutes;