import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createSalesOrder, getSalesorder, getSalesorderById, deleteSalesorder } from "../../../controllers/Department controllers/Accounting Controller/SalesOrder Accounts controller/salesOrderAccounts.controller";

const salesAccountsRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
salesAccountsRoutes
.get("/getallorder",multiRoleAuthMiddleware("owner", "staff", "CTO"), getSalesorder)
.post("/createorder",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createSalesOrder)
.delete("/deleteorder/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteSalesorder)
.get("/getsingleorder/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getSalesorderById);


    
export default salesAccountsRoutes;
