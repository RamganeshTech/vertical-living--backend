import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { addOrUpdateWorkItem, createMainInternalQuote, getSingleInternalQuote, updateMainInternalQuote, updateTemplateFields, upsertTemplateData } from "../../../controllers/Quote Controllers/QuoteGenerate Controller/internalQuoteNewVersion.controller";


const InternalQuoteRoutes = express.Router();



InternalQuoteRoutes.post(
    "/v1/createquote",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    createMainInternalQuote              // ✅ Your TS controller
);


InternalQuoteRoutes.put(
    "/v1/editquote/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateMainInternalQuote
);


InternalQuoteRoutes.get(
    "/v1/getsingle/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getSingleInternalQuote
);


InternalQuoteRoutes.post(
    "/v1/createworkitem/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    addOrUpdateWorkItem
);



InternalQuoteRoutes.put(
    "/v1/updatetemplate/:quoteId/:workId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    upsertTemplateData
);


InternalQuoteRoutes.put(
    "/v1/updatetemplatedata/:quoteId/:workId/:templateId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateTemplateFields
);









export default InternalQuoteRoutes