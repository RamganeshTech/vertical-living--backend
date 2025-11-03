import express, { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    getAllExpenses,
    getExpenseStatistics
} from "../../../controllers/Department controllers/Accounting Controller/Expense Accounts Controllers/expenseAccounts.controllers";

// ✅ GET all accounting records for an organization (with filters)



const ExpenseAccountingRoutes = express.Router();

ExpenseAccountingRoutes.use(multiRoleAuthMiddleware("owner", "staff", "CTO"))

// ✅ Create Expense
ExpenseAccountingRoutes.post("/create", createExpense);

// ✅ Update Expense
ExpenseAccountingRoutes.put("/update/:id", updateExpense);

// ✅ Delete Expense
ExpenseAccountingRoutes.delete("/delete/:id", deleteExpense);

// ✅ Get Single Expense
ExpenseAccountingRoutes.get("/getsingle/:id", getExpenseById);

// ✅ Get All Expenses with Filters & Pagination
ExpenseAccountingRoutes.get("/getall", getAllExpenses);

// ✅ Get Expense Statistics
ExpenseAccountingRoutes.get("/getstatistics", getExpenseStatistics);

export default ExpenseAccountingRoutes;
