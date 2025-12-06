import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createVendor, deleteVendor, getAllvendorDropDown, getAllvendors, getvendor, updateVendor, updateVendorDoc, updateVendorMainImage, updateVendorShopImages } from "../../../controllers/Department controllers/Accounting Controller/Vendor Accounts Controller/vendorAcc.controller";

const vendorAccountingRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
vendorAccountingRoutes
    .get("/getallvendor", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllvendors)
    .post("/createvendor", multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.fields([
            { name: 'files', maxCount: 10 }, // For documents
            // { name: 'mainImage', maxCount: 1 }, // For the shop profile image
            { name: 'shopImages' } // For the shop images
        ]),
        processUploadFiles,
        createVendor)
    .put(
        "/update-main-image/:vendorId",
        multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.single("mainImage"), // Only accepts one file field named 'mainImage'
        processUploadFiles, // If you have processing logic
        updateVendorMainImage
    )
    .put("/updatevendor/:id/document", multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles, updateVendorDoc)
    .put("/updatevendor/:id/shopimages", multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("shopImages"), processUploadFiles, updateVendorShopImages)
    .put("/updatevendor/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateVendor)
    .delete("/deletevendor/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteVendor)
    .get("/singlevendor/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), getvendor)
    .get("/getallvendorname/:organizationId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllvendorDropDown);




export default vendorAccountingRoutes;
