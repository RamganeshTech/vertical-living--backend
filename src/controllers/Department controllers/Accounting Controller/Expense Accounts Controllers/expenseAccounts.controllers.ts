import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { ExpenseAccountModel } from "../../../../models/Department Models/Accounting Model/expenseAccount.model";
import redisClient from "../../../../config/redisClient";
import { validateMongoId } from "../Customer Accounts Controllers/customerAccoutsValidation";
import { syncAccountingRecord } from "../accounting.controller";
import { AccountingModel } from "../../../../models/Department Models/Accounting Model/accountingMain.model";
import { createPaymentMainAccUtil } from "../PaymentMainAcc_controllers/paymentMainAcc.controller";

// ✅ Manual Validation Helper
const validateExpenseData = (data: any, isUpdate = false) => {
    const errors: string[] = [];

    if (!isUpdate && !data.organizationId) {
        errors.push("Organization ID is required");
    }

    if (data.organizationId && !validateMongoId(data.organizationId)) {
        errors.push("Invalid Organization ID");
    }

    // if (!isUpdate && !data.vendorId) {
    //     errors.push("Vendor ID is required");
    // }
    if (data.vendorId && !validateMongoId(data.vendorId)) {
        errors.push("Invalid Vendor ID");
    }

    if (!isUpdate && !data.vendorName) {
        errors.push("Vendor name is required");
    }

    if (data.vendorName && typeof data.vendorName !== "string") {
        errors.push("Vendor name must be a string");
    }

    if (!isUpdate && !data.amount) {
        errors.push("Amount is required");
    }

    if (data.amount && (typeof data.amount !== "number" || data.amount <= 0)) {
        errors.push("Amount must be a positive number");
    }

    if (data.expenseDate && isNaN(Date.parse(data.expenseDate))) {
        errors.push("Invalid date format for expenseDate");
    }

    if (data.dueDate && isNaN(Date.parse(data.dueDate))) {
        errors.push("Invalid date format for dueDate");
    }


    if (data.payThrough && typeof data.payThrough !== "string") {
        errors.push("PaidThrough must be a string");
    }

    if (data.notes && typeof data.notes !== "string") {
        errors.push("Notes must be a string");
    }

    return errors;
};

// ✅ CREATE Expense
export const createExpense = async (req: Request, res: Response): Promise<any> => {
    try {
        // Validate input
        const errors = validateExpenseData(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                message: "Validation failed",
                errors,
            });
        }

        const {
            organizationId,
            vendorId,
            vendorName,
            projectId,
            expenseDate,
            amount,
            payThrough,
            notes,
            dueDate,
        } = req.body;

        // Create expense
        const expense = await ExpenseAccountModel.create({
            organizationId,
            vendorId: vendorId || null,
            vendorName,
            projectId,
            expenseDate: expenseDate || new Date(),
            amount,
            dueDate,
            payThrough,
            notes,
        });

        // await expense.save();
        // 
        // Clear cache
        const cachePattern = `expenses:page:*organizationId:${organizationId}*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        // ✅ Also clear statistics cache
        const statsCachePattern = `expense-stats:organizationId:${organizationId}*`;
        const statsKeys = await redisClient.keys(statsCachePattern);
        if (statsKeys.length > 0) {
            await redisClient.del(statsKeys);
        }


        // We use the utility here because it handles Generating the Unique Record ID
        await syncAccountingRecord({
            organizationId: expense.organizationId,
            projectId: expense?.projectId || null,

            // Reference Links
            referenceId: expense._id,
            referenceModel: "ExpenseAccountModel", // Must match Schema

            // Categorization
            deptRecordFrom: "Expense",

            // Person Details
            assoicatedPersonName: expense.vendorName,
            assoicatedPersonId: expense?.vendorId || null,
            assoicatedPersonModel: "VendorAccountModel", // Assuming this is your Vendor Model

            // Financials
            amount: expense?.amount || 0, // Utility takes care of grandTotal logic if passed
            notes: expense?.notes || "",

            // Defaults for Creation
            status: "pending",
            paymentId: null
        });


        return res.status(201).json({
            ok: true,
            message: "Expense created successfully",
            data: expense,
        });
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ✅ UPDATE Expense
export const updateExpense = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid expense ID",
            });
        }

        // Validate update data
        const errors = validateExpenseData(req.body, true);
        if (errors.length > 0) {
            return res.status(400).json({
                ok: false,
                message: "Validation failed",
                errors,
            });
        }

        const {
            vendorId,
            vendorName,
            expenseNumber,
            expenseDate,
            amount,
            payThrough,
            notes,
            dueDate,
            projectId
        } = req.body;

        // Find and update expense
        const expense = await ExpenseAccountModel.findById(id);

        if (!expense) {
            return res.status(404).json({
                ok: false,
                message: "Expense not found",
            });
        }

        // Update fields
        if (vendorId) expense.vendorId = vendorId;
        if (vendorName) expense.vendorName = vendorName;
        if (expenseNumber) expense.expenseNumber = expenseNumber;
        if (expenseDate) expense.expenseDate = new Date(expenseDate);
        if (dueDate) expense.dueDate = new Date(dueDate);
        if (projectId) expense.projectId = projectId;
        if (amount !== undefined) expense.amount = amount;
        if (payThrough) expense.payThrough = payThrough;
        if (notes !== undefined) expense.notes = notes;

        await expense.save();

        // ✅ Clear list cache - Fixed pattern
        const listCachePattern = `expenses:page:*:organizationId:${expense.organizationId}*`;
        const listKeys = await redisClient.keys(listCachePattern);
        if (listKeys.length > 0) {
            await redisClient.del(listKeys);
        }

        // ✅ Clear single expense cache
        await redisClient.del(`expense:${id}`);

        // ✅ Clear statistics cache
        const statsCachePattern = `expense-stats:organizationId:${expense.organizationId}*`;
        const statsKeys = await redisClient.keys(statsCachePattern);
        if (statsKeys.length > 0) {
            await redisClient.del(statsKeys);
        }


        const isExiting = await AccountingModel.findOneAndUpdate(
            {
                referenceId: expense._id,
                referenceModel: "ExpenseAccountModel"
            },
            {
                $set: {
                    // Update fields that might have changed in the bill
                    amount: expense.amount,
                    notes: expense.notes,
                    projectId: expense?.projectId || null,
                    assoicatedPersonName: expense.vendorName,
                    // Optional: Update person ID if vendor changed
                    assoicatedPersonId: expense?.vendorId || null,
                    // IMPORTANT: We DO NOT include 'status' or 'paymentId' here.
                    // Those are controlled by the Payment Controller.
                }
            },
            { new: true }
        );



        return res.status(200).json({
            ok: true,
            message: "Expense updated successfully",
            data: expense,
        });
    } catch (error: any) {
        console.error("Error updating expense:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ✅ DELETE Expense
export const deleteExpense = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid expense ID",
            });
        }

        // Find and delete expense
        const expense = await ExpenseAccountModel.findById(id);

        if (!expense) {
            return res.status(404).json({
                ok: false,
                message: "Expense not found",
            });
        }

        const organizationId = expense.organizationId;

        await ExpenseAccountModel.findByIdAndDelete(id);

        // ✅ Clear list cache - Fixed pattern
        const listCachePattern = `expenses:page:*:organizationId:${organizationId}*`;
        const listKeys = await redisClient.keys(listCachePattern);
        if (listKeys.length > 0) {
            await redisClient.del(listKeys);
        }

        // ✅ Clear single expense cache
        await redisClient.del(`expense:${id}`);

        // ✅ Clear statistics cache
        const statsCachePattern = `expense-stats:organizationId:${organizationId}*`;
        const statsKeys = await redisClient.keys(statsCachePattern);
        if (statsKeys.length > 0) {
            await redisClient.del(statsKeys);
        }

        return res.status(200).json({
            ok: true,
            message: "Expense deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting expense:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ✅ GET Single Expense
export const getExpenseById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid expense ID",
            });
        }

        // Check cache
        const cacheKey = `expense:${id}`;
        const cachedExpense = await redisClient.get(cacheKey);

        if (cachedExpense) {
            return res.status(200).json({
                ok: true,
                message: "Expense retrieved from cache",
                data: JSON.parse(cachedExpense),
                cached: true,
            });
        }

        // Find expense
        const expense = await ExpenseAccountModel.findById(id)
            .populate("vendorId", "firstName email phone.work")
        // .populate("organizationId", "name");

        if (!expense) {
            return res.status(404).json({
                ok: false,
                message: "Expense not found",
            });
        }

        // Cache the result (expire in 1 hour)
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(expense));

        return res.status(200).json({
            ok: true,
            message: "Expense retrieved successfully",
            data: expense,
            cached: false,
        });
    } catch (error: any) {
        console.error("Error getting expense:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ✅ GET All Expenses with Filters and Pagination
export const getAllExpenses = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            vendorId,
            search,
            expenseDateFromDate,
            expenseDateToDate,
            createdFromDate,
            createdToDate,
            minAmount,
            maxAmount,
            payThrough,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Validate organizationId
        if (!organizationId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID is required",
            });
        }

        if (!validateMongoId(organizationId as string)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Organization ID",
            });
        }

        // Validate vendorId if provided
        if (vendorId && !validateMongoId(vendorId as string)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Vendor ID",
            });
        }

        // Validate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                ok: false,
                message: "Invalid page number",
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                ok: false,
                message: "Invalid limit (must be between 1 and 100)",
            });
        }

        // // Create cache key
        const cacheKey = `expenses:page:${page}:limit:${limit}:organizationId:${organizationId}:vendorId:${vendorId || "all"}:search:${search || "all"}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:expenseDateFromDate:${expenseDateFromDate || "all"}:expenseDateToDate:${expenseDateToDate || "all"}:minAmount:${minAmount || "all"}:maxAmount:${maxAmount || "all"}:payThrough:${payThrough || "all"}:sortBy:${sortBy}:sortOrder:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: "Expenses retrieved from cache",
                ...JSON.parse(cachedData),
                cached: true,
            });
        }

        // Build filter query
        const filter: any = { organizationId };

        if (vendorId) {
            filter.vendorId = vendorId;
        }

        // console.log("search", search)
        if (search) {
            filter.$or = [
                filter.vendorName = { $regex: search, $options: "i" },
                filter.expenseNumber = { $regex: search, $options: "i" },
            ]
        }


        if (createdFromDate || createdToDate) {
            const filterRange: any = {};

            if (createdFromDate) {
                const from = new Date(createdFromDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid createdFromDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (createdToDate) {
                const to = new Date(createdToDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid createdToDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.createdAt = filterRange;
        }



        if (expenseDateFromDate || expenseDateToDate) {
            const filterRange: any = {};

            if (expenseDateFromDate) {
                const from = new Date(expenseDateFromDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid expenseDateFromDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (expenseDateToDate) {
                const to = new Date(expenseDateToDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid expenseDateToDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.expenseDate = filterRange;
        }



        // Handle single date filter
        // if (date) {
        //     const startOfDay = new Date(date as string);
        //     startOfDay.setHours(0, 0, 0, 0);

        //     const endOfDay = new Date(date as string);
        //     endOfDay.setHours(23, 59, 59, 999);

        //     filter.expenseDate = {
        //         $gte: startOfDay,
        //         $lte: endOfDay
        //     };
        // }

        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) {
                filter.amount.$gte = parseFloat(minAmount as string);
            }
            if (maxAmount) {
                filter.amount.$lte = parseFloat(maxAmount as string);
            }
        }

        if (payThrough) {
            filter.payThrough = { $regex: payThrough, $options: "i" };
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Calculate skip
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const [expenses, totalCount] = await Promise.all([
            ExpenseAccountModel.find(filter)
                .populate("vendorId", "vendorName")
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ExpenseAccountModel.countDocuments(filter),
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const response = {
            data: expenses,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        };

        // Cache the result (expire in 5 minutes)
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

        return res.status(200).json({
            ok: true,
            message: "Expenses retrieved successfully",
            ...response,
            cached: false,
        });
    } catch (error: any) {
        console.error("Error getting expenses:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};



//  SYNC TO PAYMENT MAIN

export const sendExpenseToPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { expenseId } = req.params; // We expect the Bill ID to be sent

        // 1. Validate Bill ID
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Bill ID format"
            });
        }

        // 2. Fetch the Bill
        const expense = await ExpenseAccountModel.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                ok: false,
                message: "Expense not found"
            });
        }


        if (expense?.isSyncWithPaymentsSection) {
            return res.status(400).json({ message: "Bill Already sent to the payment section", ok: false })
        }


        // 3. Prepare the Accounting Items (Mapped from Bill)
        const paymentItems = [{
            itemName: "expense item",
            quantity: 1,
            rate: expense.amount || 0,
            unit: "",
            totalCost: expense.amount || 0,
            dueDate: expense.dueDate,
            status: "pending",
            orderId: "",
            paymentId: "",
            transactionId: "",
            paidAt: null,
            failureReason: "",
            fees: null,
            tax: null
        }];


        const newPayemnt = await createPaymentMainAccUtil({
            paymentPersonId: expense.vendorId || null,
            paymentPersonModel: expense?.vendorId ? "VendorAccountModel" : null,
            paymentPersonName: expense?.vendorName || "",
            organizationId: expense.organizationId,
            accountingRef: null,
            projectId: expense?.projectId || null,
            fromSectionModel: "ExpenseAccountModel",
            fromSectionId: expense._id as any,
            fromSection: "Expense",
            paymentDate: null,
            dueDate: expense.dueDate,
            subject: "",
            items: paymentItems,
            totalAmount: expense.amount || 0,
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: 0,
            taxAmount: 0,
            grandTotal: expense.amount,
            notes: expense.notes,
            isSyncedWithAccounting: false,
            generalStatus: "pending"
        })

        expense.isSyncWithPaymentsSection = true;
        await expense.save()


        // ✅ Clear single expense cache
        await redisClient.del(`expense:${expenseId}`);

        // ✅ Clear statistics cache
        const statsCachePattern = `expense-stats:organizationId:${expense.organizationId}*`;
        const statsKeys = await redisClient.keys(statsCachePattern);
        if (statsKeys.length > 0) {
            await redisClient.del(statsKeys);
        }





        return res.status(201).json({
            ok: true,
            message: "Sent to Payments Section successfully",
            data: newPayemnt
        });

    } catch (error: any) {
        console.error("Error sending bill to payement:", error);
        return res.status(500).json({
            ok: false,
            message: "Error processing request",
            error: error.message
        });
    }
}
