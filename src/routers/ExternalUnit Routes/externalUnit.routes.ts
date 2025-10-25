import express from "express";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";
import { createWardrobeUnit, getWardrobeUnits } from "../../controllers/ExternalUnit Controller/externalUnit.controller";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";

const externalUnitRoutes = express.Router();

// 📌 Create a wardrobe unit (with optional image upload)
externalUnitRoutes.post(
  "/createwardrobe",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.array("file"), // Accept multiple files, even though you extract only one image
  processUploadFiles, // if used in your app for validation
  createWardrobeUnit
);

// 📌 Get all wardrobe units with search + pagination
externalUnitRoutes.get("/getwardrobe", getWardrobeUnits);

export default externalUnitRoutes;
