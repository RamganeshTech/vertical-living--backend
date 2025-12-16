import { Request, Response } from "express";
import mongoose from "mongoose";
import { PaymentMainAccountModel } from "../../models/Department Models/Accounting Model/paymentMainAcc.model";
// import { PaymentMainAccountModel } from "./path-to-your-model/paymentAccModel"; // Update path

// Helper to ensure ObjectId casting
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * REPORT 1: Project Spending Overview
 * Calculates specifically how much money has been successfully PAID per project.
 */
export const getProjectSpendingOverview = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params; // Or req.user depending on your auth setup

        const report = await PaymentMainAccountModel.aggregate([
            {
                $match: {
                    organizationId: toObjectId(organizationId),
                    // We only calculate money "Spent" if the status is paid
                    generalStatus: { $in: ["paid", "completed"] } 
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    totalAmountSpent: { $sum: "$grandTotal" }, // Summing the Grand Total
                    numberOfTransactions: { $sum: 1 },
                    lastPaymentDate: { $max: "$paymentDate" }
                }
            },
            {
                $lookup: {
                    from: "ProjectModel", // Ensure this matches your actual MongoDB collection name for projects (usually lowercase plural)
                    localField: "_id",
                    foreignField: "_id",
                    as: "projectDetails"
                }
            },
            {
                $unwind: {
                    path: "$projectDetails",
                    preserveNullAndEmptyArrays: true // Keep payments even if project was deleted/null
                }
            },
            {
                $project: {
                    _id: 0,
                    projectId: "$_id",
                    projectName: { $ifNull: ["$projectDetails.projectName", "General / Unassigned"] }, // Adjust '.name' to your Project Model field
                    totalAmountSpent: 1,
                    numberOfTransactions: 1,
                    lastPaymentDate: 1
                }
            },
            { $sort: { totalAmountSpent: -1 } } // Sort by highest spender
        ]);

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error("Error in getProjectSpendingOverview:", error);
        return res.status(500).json({ success: false, message: "Server Error", error });
    }
};

/**
 * REPORT 2: Department (Section) Spending Breakdown
 * Shows which department (fromSection) is spending the most money.
 */
export const getDepartmentSpendingReport = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;

        const report = await PaymentMainAccountModel.aggregate([
            {
                $match: {
                    organizationId: toObjectId(organizationId),
                    generalStatus: "paid" // Only counting actual money spent
                }
            },
            {
                $group: {
                    _id: "$fromSection", // Grouping by Department/Section
                    totalSpent: { $sum: "$grandTotal" },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    departmentName: { $ifNull: ["$_id", "Unknown Section"] },
                    totalSpent: 1,
                    transactionCount: 1
                }
            },
            { $sort: { totalSpent: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error("Error in getDepartmentSpendingReport:", error);
        return res.status(500).json({ success: false, message: "Server Error", error });
    }
};

/**
 * REPORT 3: Detailed Financial Status (Paid vs Pending)
 * This is useful to see "How much we have paid" vs "How much we still owe" per project.
 */
export const getProjectFinancialStatus = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;

        const report = await PaymentMainAccountModel.aggregate([
            {
                $match: {
                    organizationId: toObjectId(organizationId)
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    // Total value of all bills/payments created
                    totalInvoicedValue: { $sum: "$grandTotal" },
                    
                    // Amount actually Paid
                    totalPaid: {
                        $sum: {
                            $cond: [{ $eq: ["$generalStatus", "paid"] }, "$grandTotal", 0]
                        }
                    },
                    
                    // Amount Pending
                    totalPending: {
                        $sum: {
                            $cond: [{ $ne: ["$generalStatus", "paid"] }, "$grandTotal", 0]
                        }
                    },
                    
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "projects", 
                    localField: "_id",
                    foreignField: "_id",
                    as: "projectDetails"
                }
            },
            {
                $unwind: { path: "$projectDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 0,
                    projectId: "$_id",
                    projectName: { $ifNull: ["$projectDetails.name", "Unassigned"] },
                    totalInvoicedValue: 1,
                    totalPaid: 1,
                    totalPending: 1,
                    paymentProgress: {
                        $cond: [
                            { $eq: ["$totalInvoicedValue", 0] },
                            0,
                            { $multiply: [{ $divide: ["$totalPaid", "$totalInvoicedValue"] }, 100] }
                        ]
                    }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error("Error in getProjectFinancialStatus:", error);
        return res.status(500).json({ success: false, message: "Server Error", error });
    }
};