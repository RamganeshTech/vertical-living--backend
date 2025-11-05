import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomer, updateCustomer, updateCustomerDoc } from "../../../controllers/Department controllers/Accounting Controller/Customer Accounts Controllers/customerAccounts.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { getPurchases, createPurchase, deletePurchase, getPurchaseById } from "../../../controllers/Department controllers/Accounting Controller/Purchase Accounts Contorller/purchaseAcc.controller";
// import { createBill, deleteBill, getBillById, getBills } from "../../../controllers/Department controllers/Accounting Controller/Bill Accounts Controller/billAccounts.controller";

const PurchaseAccRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
PurchaseAccRoutes
.get("/getallpurchase",multiRoleAuthMiddleware("owner", "staff", "CTO"), getPurchases)
.post("/createpurchase",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createPurchase)
.delete("/deletepurchase/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deletePurchase)
.get("/getsinglepurchase/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getPurchaseById);


    
export default PurchaseAccRoutes;
