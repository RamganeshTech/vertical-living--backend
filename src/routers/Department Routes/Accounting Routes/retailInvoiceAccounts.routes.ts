import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createRetailInvoice, deleteRetailInvoice, getRetailInvoiceById, getRetailInvoices } from "../../../controllers/Department controllers/Accounting Controller/Retail Invoice Acc Controllers/retailInvoiceAcc.controllers";

const retailInvoiceAccountRoutes = Router();

retailInvoiceAccountRoutes
.get("/getallinvoice",multiRoleAuthMiddleware("owner", "staff", "CTO"), getRetailInvoices)
.post("/createinvocie",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createRetailInvoice)
.delete("/deleteinvoice/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteRetailInvoice)
.get("/getsingleinvoice/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getRetailInvoiceById);


    
export default retailInvoiceAccountRoutes;
