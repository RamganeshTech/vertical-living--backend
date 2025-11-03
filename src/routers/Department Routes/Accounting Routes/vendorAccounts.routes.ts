import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createVendor, deleteVendor, getAllvendorDropDown, getAllvendors, getvendor, updateVendor, updateVendorDoc } from "../../../controllers/Department controllers/Accounting Controller/Vendor Accounts Controller/vendorAcc.controller";

const vendorAccountingRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
vendorAccountingRoutes
.get("/getallvendor",multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllvendors)
.post("/createvendor",multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles,  createVendor)
.put("/updatevendor/:id/document",multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles,  updateVendorDoc)
.put("/updatevendor/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),updateVendor)
.delete("/deletevendor/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteVendor)
.get("/singlevendor/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getvendor)
.get("/getallvendorname/:organizationId",multiRoleAuthMiddleware("owner", "staff", "CTO"),getAllvendorDropDown);



    
export default vendorAccountingRoutes;
