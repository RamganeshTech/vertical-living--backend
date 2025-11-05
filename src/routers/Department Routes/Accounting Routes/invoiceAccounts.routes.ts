import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomer, updateCustomer, updateCustomerDoc } from "../../../controllers/Department controllers/Accounting Controller/Customer Accounts Controllers/customerAccounts.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createInvoice, deleteInvoice, getInvoiceById, getInvoices } from "../../../controllers/Department controllers/Accounting Controller/Invoice Accounts Controllers/invoiceAccounts.controlller";

const invoiceAccountRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
invoiceAccountRoutes
.get("/getallinvoice",multiRoleAuthMiddleware("owner", "staff", "CTO"), getInvoices)
.post("/createinvoice",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createInvoice)
.delete("/deleteinvoice/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteInvoice)
.get("/getsingleinvoice/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getInvoiceById);


    
export default invoiceAccountRoutes;
