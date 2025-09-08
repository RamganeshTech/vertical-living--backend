import { Router } from "express";
import { deleteAccounting, getAccounting, getSingleAccounting, updateAccountingTransaction } from "../../../controllers/Department controllers/Accounting Controller/accounting.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const accountingRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
accountingRoutes.get("/getaccountingall",multiRoleAuthMiddleware("owner", "staff", "CTO"), getAccounting);

// ✅ UPDATE accounting record
accountingRoutes.put("/update/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),updateAccountingTransaction);

// ✅ DELETE accounting record
accountingRoutes.delete("/delete/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteAccounting);

accountingRoutes.get(
  "/single/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getSingleAccounting
);

export default accountingRoutes;
