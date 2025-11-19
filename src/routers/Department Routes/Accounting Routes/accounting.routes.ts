import { Router } from "express";
import { addInstallments, createAccountInstallmentOrder, deleteAccounting, getAccounting, getSingleAccounting, updateAccountingTransaction, verifyAccountsInstallmentPayment } from "../../../controllers/Department controllers/Accounting Controller/accounting.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const accountingRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
accountingRoutes.get("/getaccountingall", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAccounting);

// ✅ UPDATE accounting record
accountingRoutes.put("/update/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateAccountingTransaction);

accountingRoutes.put("/addinstallments/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), addInstallments);

// ✅ DELETE accounting record
accountingRoutes.delete("/delete/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteAccounting);

accountingRoutes.get(
  "/single/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getSingleAccounting
);

accountingRoutes.post(
  "/createorder/:accountingId/:installmentId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  createAccountInstallmentOrder);

accountingRoutes.post(
  "/verifypayment/:accId/:installmentId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  verifyAccountsInstallmentPayment);

export default accountingRoutes;
