import express from "express";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createMaterialQuote,  deleteMaterialQuoteById,  editQuoteMaterial,  getMaterialQuoteEntries } from "../../../controllers/Quote Controllers/QuoteGenerate Controller/quoteGenerate.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getMaterialCategories } from "../../../controllers/Quote Controllers/RateConfig Controller/rateConfig.controller";
import {  createVariantQuotePdfGenerator, getMaterialItemsByCategoryForQuote, getMaterialQuoteSingle, getVariantQuoteDetails } from "../../../controllers/Quote Controllers/Quote Varaint Controller/QuoteVariant.controller";
import { getAllClientQuotes, getSingleClientQuote, storeQuoteToPaymentStage, toggleBlurring } from "../../../controllers/Quote Controllers/Client Quote Controllers/clientQuote.controller";

const QuoteRouter = express.Router();

QuoteRouter.post(
  "/createquote/:organizationId/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.any(),           // ✅ Handles multiple field names like images[0], images[1]
  processUploadFiles,              // Optional: Normalize any req.files array if needed
  createMaterialQuote              // ✅ Your TS controller
);


QuoteRouter.put(
  "/editquote/:organizationId/:projectId/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  editQuoteMaterial  
);


QuoteRouter.get(
  "/getquotes/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getMaterialQuoteEntries
);



// QuoteRouter.get(
//   "/getcategories/:organizationId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   getMaterialCategories
// );




// QUOTE VARIANT ROUTES
QuoteRouter.get(
  "/getquotesingle/:organizationId/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getMaterialQuoteSingle
);


QuoteRouter.get(
  "/getmaterials/:organizationId/:categoryName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getMaterialItemsByCategoryForQuote
);



QuoteRouter.delete(
  '/deletequote/:id',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'), // if required
  deleteMaterialQuoteById
);



QuoteRouter.post(
  "/generatepdf/:quoteId/create",
  multiRoleAuthMiddleware("owner", "staff", "CTO"), // if needed
  createVariantQuotePdfGenerator
);



QuoteRouter.get(
  "/getquotepdf/quote/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getVariantQuoteDetails
);




// client quote routes
QuoteRouter.get(
  "/getallquotevarients/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllClientQuotes
);


QuoteRouter.get("/getsingleclientquote/:organizationId/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getSingleClientQuote)


  
QuoteRouter.put("/storetopaymentstage/:organizationId/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  storeQuoteToPaymentStage)

QuoteRouter.patch("/toggleblur/:organizationId/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  toggleBlurring)

  

export default QuoteRouter;