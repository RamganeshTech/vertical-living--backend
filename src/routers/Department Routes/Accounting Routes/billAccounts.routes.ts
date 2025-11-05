import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomer, updateCustomer, updateCustomerDoc } from "../../../controllers/Department controllers/Accounting Controller/Customer Accounts Controllers/customerAccounts.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createBill, deleteBill, getBillById, getBills } from "../../../controllers/Department controllers/Accounting Controller/Bill Accounts Controller/billAccounts.controller";

const BillAccountRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
BillAccountRoutes
.get("/getallbill",multiRoleAuthMiddleware("owner", "staff", "CTO"), getBills)
.post("/createbill",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createBill)
.delete("/deletebill/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteBill)
.get("/getsinglebill/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getBillById);


    
export default BillAccountRoutes;
