import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { ExpenseAccountModel } from "../../../../models/Department Models/Accounting Model/expenseAccount.model";
import redisClient from "../../../../config/redisClient";
import { validateMongoId } from "../Customer Accounts Controllers/customerAccoutsValidation";

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

    if (data.dateOfPayment && isNaN(Date.parse(data.dateOfPayment))) {
        errors.push("Invalid date format for dateOfPayment");
    }

    if (data.paidThrough && typeof data.paidThrough !== "string") {
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
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const {
            organizationId,
            vendorId,
            vendorName,
            dateOfPayment,
            amount,
            paidThrough,
            notes,
        } = req.body;

        // Create expense
        const expense = await ExpenseAccountModel.create({
            organizationId,
            vendorId: vendorId || null,
            vendorName,
            dateOfPayment: dateOfPayment || new Date(),
            amount,
            paidThrough,
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

        return res.status(201).json({
            success: true,
            message: "Expense created successfully",
            data: expense,
        });
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return res.status(500).json({
            success: false,
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
                success: false,
                message: "Invalid expense ID",
            });
        }

        // Validate update data
        const errors = validateExpenseData(req.body, true);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const {
            vendorId,
            vendorName,
            invoiceNumber,
            dateOfPayment,
            amount,
            paidThrough,
            notes,
        } = req.body;

        // Find and update expense
        const expense = await ExpenseAccountModel.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        // Update fields
        if (vendorId) expense.vendorId = vendorId;
        if (vendorName) expense.vendorName = vendorName;
        if (invoiceNumber) expense.invoiceNumber = invoiceNumber;
        if (dateOfPayment) expense.dateOfPayment = new Date(dateOfPayment);
        if (amount !== undefined) expense.amount = amount;
        if (paidThrough) expense.paidThrough = paidThrough;
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


        return res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            data: expense,
        });
    } catch (error: any) {
        console.error("Error updating expense:", error);
        return res.status(500).json({
            success: false,
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
                success: false,
                message: "Invalid expense ID",
            });
        }

        // Find and delete expense
        const expense = await ExpenseAccountModel.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
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
            success: true,
            message: "Expense deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting expense:", error);
        return res.status(500).json({
            success: false,
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
                success: false,
                message: "Invalid expense ID",
            });
        }

        // Check cache
        const cacheKey = `expense:${id}`;
        const cachedExpense = await redisClient.get(cacheKey);

        if (cachedExpense) {
            return res.status(200).json({
                success: true,
                message: "Expense retrieved from cache",
                data: JSON.parse(cachedExpense),
                cached: true,
            });
        }

        // Find expense
        const expense = await ExpenseAccountModel.findById(id)
            .populate("vendorId", "name email phone")
            .populate("organizationId", "name");

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        // Cache the result (expire in 1 hour)
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(expense));

        return res.status(200).json({
            success: true,
            message: "Expense retrieved successfully",
            data: expense,
            cached: false,
        });
    } catch (error: any) {
        console.error("Error getting expense:", error);
        return res.status(500).json({
            success: false,
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
            date,
            minAmount,
            maxAmount,
            paidThrough,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Validate organizationId
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        if (!validateMongoId(organizationId as string)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Organization ID",
            });
        }

        // Validate vendorId if provided
        if (vendorId && !validateMongoId(vendorId as string)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Vendor ID",
            });
        }

        // Validate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid page number",
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid limit (must be between 1 and 100)",
            });
        }

        // Create cache key
        const cacheKey = `expenses:page:${page}:limit:${limit}:organizationId:${organizationId}:vendorId:${vendorId || "all"}:search:${search || "all"}:date:${date || "all"}:minAmount:${minAmount || "all"}:maxAmount:${maxAmount || "all"}:paidThrough:${paidThrough || "all"}:sortBy:${sortBy}:sortOrder:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
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

        console.log("search", search)
        if (search) {
            filter.$or = [
                filter.vendorName = { $regex: search, $options: "i" },
                filter.invoiceNumber = { $regex: search, $options: "i" },
            ]
        }

        // Handle single date filter
        if (date) {
            const startOfDay = new Date(date as string);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date as string);
            endOfDay.setHours(23, 59, 59, 999);

            filter.dateOfPayment = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) {
                filter.amount.$gte = parseFloat(minAmount as string);
            }
            if (maxAmount) {
                filter.amount.$lte = parseFloat(maxAmount as string);
            }
        }

        if (paidThrough) {
            filter.paidThrough = { $regex: paidThrough, $options: "i" };
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
            success: true,
            message: "Expenses retrieved successfully",
            ...response,
            cached: false,
        });
    } catch (error: any) {
        console.error("Error getting expenses:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ✅ GET Expense Statistics (Bonus)
export const getExpenseStatistics = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, startDate, endDate } = req.query;

        // Validate organizationId
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        if (!validateMongoId(organizationId as string)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Organization ID",
            });
        }

        // Create cache key
        const cacheKey = `expense-stats:organizationId:${organizationId}:startDate:${startDate || "all"}:endDate:${endDate || "all"}`;

        // Check cache
        const cachedStats = await redisClient.get(cacheKey);
        if (cachedStats) {
            return res.status(200).json({
                success: true,
                message: "Statistics retrieved from cache",
                data: JSON.parse(cachedStats),
                cached: true,
            });
        }

        // Build filter
        const filter: any = { organizationId };

        if (startDate || endDate) {
            filter.dateOfPayment = {};
            if (startDate) {
                filter.dateOfPayment.$gte = new Date(startDate as string);
            }
            if (endDate) {
                filter.dateOfPayment.$lte = new Date(endDate as string);
            }
        }

        // Calculate statistics
        const stats = await ExpenseAccountModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                    averageAmount: { $avg: "$amount" },
                    maxAmount: { $max: "$amount" },
                    minAmount: { $min: "$amount" },
                },
            },
        ]);

        const statistics = stats.length > 0 ? stats[0] : {
            totalExpenses: 0,
            totalAmount: 0,
            averageAmount: 0,
            maxAmount: 0,
            minAmount: 0,
        };

        // Get top vendors
        const topVendors = await ExpenseAccountModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$vendorId",
                    vendorName: { $first: "$vendorName" },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 5 },
        ]);

        const result = {
            ...statistics,
            topVendors,
        };

        // Cache the result (expire in 10 minutes)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(result));

        return res.status(200).json({
            success: true,
            message: "Statistics retrieved successfully",
            data: result,
            cached: false,
        });
    } catch (error: any) {
        console.error("Error getting expense statistics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};