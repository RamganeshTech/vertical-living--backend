    import { Router } from "express";
    import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
    import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createExecutionPartner, deleteExecutionPartner, getAllExecutionPartner, getAllExecutionPartnerDropDown, getExecutionPartner, quickExecutionPartnerCreate, updateExecutionPartner, updateExecutionPartnerDoc, updateExecutionPartnerMainImage, updateExecutionPartnerShopImages } from "../../../controllers/Department controllers/Accounting Controller/execution_controllers/executionPartner.controllers";

    const ExecutionPartnerAccountingRoutes = Router();

    // ✅ GET all accounting records for an organization (with filters)
    ExecutionPartnerAccountingRoutes
        .get("/getallexecutionpartner", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllExecutionPartner)
        .post("/createexecutionpartner", multiRoleAuthMiddleware("owner", "staff", "CTO"),
            imageUploadToS3.fields([
                { name: 'files', maxCount: 10 }, // For documents
                // { name: 'mainImage', maxCount: 1 }, // For the shop profile image
                { name: 'shopImages' } // For the shop images
            ]),
            processUploadFiles,
            createExecutionPartner)
        .post('/quick/createexecutionpartner', multiRoleAuthMiddleware("owner", "staff", "CTO"), quickExecutionPartnerCreate)
        // not use update-main-image
        .put(
            "/update-main-image/:executionpartnerId",
            multiRoleAuthMiddleware("owner", "staff", "CTO"),
            imageUploadToS3.single("mainImage"), // Only accepts one file field named 'mainImage'
            processUploadFiles, // If you have processing logic
            updateExecutionPartnerMainImage
        )
        .put("/updateexecutionpartner/:id/document", multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles, updateExecutionPartnerDoc)
        .put("/updateexecutionpartner/:id/shopimages", multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("shopImages"), processUploadFiles, updateExecutionPartnerShopImages)
        .put("/updateexecutionpartner/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateExecutionPartner)
        .delete("/deleteexecutionpartner/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteExecutionPartner)
        .get("/singleexecutionpartner/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), getExecutionPartner)
        .get("/getallexecutionpartnername/:organizationId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllExecutionPartnerDropDown);




    export default ExecutionPartnerAccountingRoutes;
