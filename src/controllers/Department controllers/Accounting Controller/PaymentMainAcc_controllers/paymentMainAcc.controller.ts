import mongoose, { ClientSession, FilterQuery } from "mongoose";
import { Request, Response } from "express";
import { IPaymentMainAcc, PaymentMainAccountModel } from "../../../../models/Department Models/Accounting Model/paymentMainAcc.model";
import { AccountingModel } from "../../../../models/Department Models/Accounting Model/accountingMain.model";


/**
 * Utility to create a Payment Record from other modules (Bills/Expenses).
 * 
 * @param paymentData - Object containing data matching IPaymentMainAcc
 * @param session - (Optional) Mongoose Transaction Session. 
 *                  Highly recommended to pass this if calling from Bill creation 
 *                  to ensure if Payment fails, Bill creation also rolls back.
 */
export const createPaymentMainAccUtil = async (
    paymentData: Partial<IPaymentMainAcc>,
    // session: mongoose.ClientSession | null = null
): Promise<IPaymentMainAcc> => {
    try {
        console.log("Creating Payment Record from:", paymentData.fromSection);

        // We use array syntax [] inside create because we might be passing a session
        // and create returns an array when used this way.
        // const [newPayment] = await PaymentMainAccountModel.create([paymentData], { session });
        const newPayment = await PaymentMainAccountModel.create(paymentData);

        if (!newPayment) {
            throw new Error("Failed to create payment record in utility.");
        }

        return newPayment;
    } catch (error) {
        console.error("Error in createPaymentUtil:", error);
        throw error; // Re-throw so the calling controller (Bill/Expense) handles the rollback
    }
};



export const getAllPaymentsAcc = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            projectId,
            personName,
            minAmount,
            maxAmount,
            startDate,
            endDate,
            fromSection,
            // Pagination params (defaults: page 1, limit 10)
            page = 1,
            limit = 10
        } = req.query;



        console.log("req.query", req.query)
        // --- 1. Calculate Pagination ---
        const pageNumber = parseInt(page as string, 10) || 1;
        const limitNumber = parseInt(limit as string, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        // --- 2. Initialize Query Object ---
        const filter: FilterQuery<IPaymentMainAcc> = {};

        // --- 3. Apply Filters ---
        if (organizationId) {
            filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
        }

        if (projectId && mongoose.Types.ObjectId.isValid(projectId as string)) {
            filter.projectId = new mongoose.Types.ObjectId(projectId as string);
        }

        if (personName) {
            filter.paymentPersonName = { $regex: personName as string, $options: "i" };
        }

        if (fromSection) {
            filter.fromSection = fromSection as string;
        }

        if (minAmount || maxAmount) {
            filter.grandTotal = {};
            if (minAmount) filter.grandTotal.$gte = Number(minAmount);
            if (maxAmount) filter.grandTotal.$lte = Number(maxAmount);
        }

        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
            if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
        }

        // --- 4. Execute Query (With Pagination) ---

        // Get Total Count for metadata
        const totalCount = await PaymentMainAccountModel.countDocuments(filter);

        // Get Actual Data
        const payments = await PaymentMainAccountModel.find(filter)
            .sort({ createdAt: -1 }) // Latest first
            .skip(skip)
            .limit(limitNumber)
            .populate("projectId", "projectName _id")
            // Ensure the fields here exist in your Vendor/Customer schemas
            .populate("paymentPersonId", "vendorName customerName companyName");

        // --- 5. Determine Next Page ---
        const totalPages = Math.ceil(totalCount / limitNumber);
        const hasNextPage = pageNumber < totalPages;
        const nextPage = hasNextPage ? pageNumber + 1 : null;

        return res.status(200).json({
            success: true,
            // Return pagination metadata
            pagination: {
                totalCount,
                totalPages,
                currentPage: pageNumber,
                nextPage,
                limit: limitNumber
            },
            data: payments
        });

    } catch (error: any) {
        console.error("Error in getAllPayments:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// ==============================================================================
// GET SINGLE PAYMENT
// ==============================================================================
export const getSinglePaymentAcc = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Payment ID" });
        }

        const payment = await PaymentMainAccountModel.findById(id)
            .populate("projectId", "_id projectName")
            .populate("accountingRef")
            .populate("paymentPersonId", "vendorName customerName companyName")
            .populate("fromSectionId")// Optional: Populate person details


        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment record not found" });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error: any) {
        console.error("Error in getSinglePayment:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// 
export const sendPaymentToAcc = async (req: Request, res: Response): Promise<any> => {
    try {
        const { paymentId } = req.params;

        // 1. Validate ID
        if (!paymentId) {
            return res.status(400).json({ success: false, message: "Payment ID is required" });
        }

        // 2. Fetch the Payment Record
        const payment = await PaymentMainAccountModel.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment record not found" });
        }


        

        const result = await AccountingModel.findOneAndUpdate(
            {
                referenceId: payment.fromSectionId,
                referenceModel: payment.fromSectionModel
            },
            { $set: { paymentId: paymentId, } },
            { new: true }
        );


        if (!result) {
            return res.status(404).json({ success: false, message: "Failed to create the record in accounts department" });
        }


        // 6. Optional: Flag the payment as synced so you don't sync it again
        // 4. Flag the payment as synced
        if (!payment.isSyncedWithAccounting) {
            payment.isSyncedWithAccounting = true;
            await payment.save();
        }

        return res.status(200).json({
            success: true,
            message: "Payment successfully synced to Accounting",
            data: result
        });

    } catch (error: any) {
        console.error("Error sending payment to account:", error);
        return res.status(500).json({
            success: false,
            message: "Error syncing payment",
            error: error.message
        });
    }
};

// ==============================================================================
// DELETE PAYMENT
// ==============================================================================
export const deletePaymentAcc = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Payment ID" });
        }

        const deletedPayment = await PaymentMainAccountModel.findByIdAndDelete(id);

        if (!deletedPayment) {
            return res.status(404).json({ success: false, message: "Payment record not found or already deleted" });
        }

        return res.status(200).json({
            success: true,
            message: "Payment record deleted successfully",
            data: deletedPayment
        });

    } catch (error: any) {
        console.error("Error in deletePayment:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};