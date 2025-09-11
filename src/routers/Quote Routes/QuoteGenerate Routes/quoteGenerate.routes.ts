import express from "express";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createMaterialQuote, getMaterialItemsByCategoryForQuote } from "../../../controllers/Quote Controllers/QuoteGenerate Controller/quoteGenerate.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getMaterialCategories } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";

const QuoteRouter = express.Router();

QuoteRouter.post(
  "/createquote/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.any(),           // ✅ Handles multiple field names like images[0], images[1]
  processUploadFiles,              // Optional: Normalize any req.files array if needed
  createMaterialQuote              // ✅ Your TS controller
);


QuoteRouter.get(
  "/getcategories/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getMaterialCategories
);


QuoteRouter.get(
  "/getmaterials/:organizationId/:categoryId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getMaterialItemsByCategoryForQuote
);

export default QuoteRouter;