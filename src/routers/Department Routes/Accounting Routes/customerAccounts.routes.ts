import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createCustomer, deleteCustomer, getAllCustomerDropDown, getAllCustomers, getCustomer, updateCustomer, updateCustomerDoc } from "../../../controllers/Department controllers/Accounting Controller/Customer Accounts Controllers/customerAccounts.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";

const customerAccountingRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
customerAccountingRoutes
.get("/getallcustomer",multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllCustomers)
.post("/createcustomer",multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles,  createCustomer)
.put("/updatecustomer/:id/document",multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.array("files"), processUploadFiles,  updateCustomerDoc)
.put("/updatecustomer/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),updateCustomer)
.delete("/deletecustomer/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteCustomer)
.get("/singlecustomer/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getCustomer)
.get("/getallcustomername/:organizationId",multiRoleAuthMiddleware("owner", "staff", "CTO"),getAllCustomerDropDown);



    
export default customerAccountingRoutes;
