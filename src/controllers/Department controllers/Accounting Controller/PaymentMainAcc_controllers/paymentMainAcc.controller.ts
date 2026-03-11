import mongoose, { ClientSession, FilterQuery } from "mongoose";
import { Request, Response } from "express";
import { IPaymentMainAcc, PaymentMainAccountModel } from "../../../../models/Department Models/Accounting Model/paymentMainAcc.model";
import { AccountingModel } from "../../../../models/Department Models/Accounting Model/accountingMain.model";
import { BillAccountModel } from "../../../../models/Department Models/Accounting Model/billAccount.model";


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



export const uploadCashPaymentProofOnly = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const files = req.files as (Express.Multer.File & { location: string })[];
        if (!files || files.length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const mappedFiles = files.map(file => ({
            _id: new mongoose.Types.ObjectId(),
            type: file.mimetype.startsWith("image") ? "image" : "pdf",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date()
        }));

        const updatedPayment = await PaymentMainAccountModel.findByIdAndUpdate(
            id,
            { $push: { paymentProof: { $each: mappedFiles } } }, // $push appends specifically
            { new: true }
        );

        if (!updatedPayment) {
            return res.status(404).json({ message: "payment order not found", ok: false })
        }

        // await invalidateBillCache((updatedBill as any).organizationId, (updatedBill as any).vendorId, id);


        res.status(200).json({ ok: true, message: "uploaded successfully", data: updatedPayment });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


/**
 * Controller to verify OTP and finalize Cash Payment
 */
export const verifyAndProcessCashPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const {  recipientName, phoneNo } = req.body;

        // 1. Find the payment record
        const payment = await PaymentMainAccountModel.findById(id);

        if (!payment) {
            return res.status(404).json({ ok: false, message: "Payment record not found" });
        }

        // // 2. Security Check: Verify OTP 
        // // (In a real app, compare with the OTP stored in the DB during the 'Generate' step)
        // if (payment.cashCollectionDetail.otp !== otp) {
        //     return res.status(400).json({ ok: false, message: "Invalid OTP authorization" });
        // }

        // 3. Update the record to Cash Mode and Paid status
        payment.paymentMode = "cash";
        // payment.generalStatus = "paid"; // Mark as paid
        
        // Ensure recipient details are stored exactly as they were at time of payment
        payment.cashCollectionDetail = {
            recipientName: recipientName || payment.cashCollectionDetail.recipientName,
            phoneNo: phoneNo || payment.cashCollectionDetail.phoneNo,
            otp: null, // Clear OTP after successful use
            otpExpiresAt: new Date()
        };

        await payment.save();

        return res.status(200).json({
            ok: true,
            message: "Cash payment processed and recorded successfully",
            data: payment
        });

    } catch (error: any) {
        return res.status(500).json({
            ok: false,
            message: error.message,
            error: "Error occured in the verifying the cash method"
        });
    }
};


export const getAllPaymentsAccWihtoutPaginationForExport = async (req: Request, res: Response): Promise<any> => {
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
            sourceStatus
            // Pagination params (defaults: page 1, limit 10)
          
        } = req.query;



        console.log("req.query", req.query)
      
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

        //  if (minAmount || maxAmount) {
        //     filter["grandTotal.totalAmount"] = {};

        //     if (minAmount) filter["grandTotal.totalAmount"].$gte = Number(minAmount);
        //     if (maxAmount) filter["grandTotal.totalAmount"].$lte = Number(maxAmount);
        // }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }


        if(sourceStatus){
            filter.sourceStatus = sourceStatus
        }

        // --- 4. Execute Query (With Pagination) ---

        // Get Total Count for metadata

        // Get Actual Data
        const payments = await PaymentMainAccountModel.find(filter)
            .sort({ createdAt: -1 }) // Latest first
            .populate("projectId", "projectName _id")
            // Ensure the fields here exist in your Vendor/Customer schemas
            .populate("paymentPersonId", "vendorName customerName companyName");

       
        return res.status(200).json({
            ok: true,
            data: payments
        });

    } catch (error: any) {
        console.error("Error in getAllPayments:", error);
        return res.status(500).json({
            success: false,
            ok: false,
            message: "Server Error",
            error: error.message
        });
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
            sourceStatus,
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

        //  if (minAmount || maxAmount) {
        //     filter["grandTotal.totalAmount"] = {};

        //     if (minAmount) filter["grandTotal.totalAmount"].$gte = Number(minAmount);
        //     if (maxAmount) filter["grandTotal.totalAmount"].$lte = Number(maxAmount);
        // }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }

         if(sourceStatus){
            filter.sourceStatus = sourceStatus
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
            // .populate("accountingRef")
            .populate("paymentPersonId", "vendorName customerName companyName customerLanguage address vendorLanguage phone mainImage")
            // .populate("fromSectionId")// Optional: Populate person details


        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment record not found" });
        }

        return res.status(200).json({
            success: true,
            ok: true,
            data: payment
        });

    } catch (error: any) {
        console.error("Error in getSinglePayment:", error);
        return res.status(500).json({
            success: false,
            ok:false,
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


// const runOneTimeAccountingMigration = async () => {
//     try {
//         console.log("🚀 Starting Source Status Migration...");

//         // Use an empty filter {} to target EVERY document in the collection
//         // even if the field is missing or already has a different value.
//         const paymentUpdate = await PaymentMainAccountModel.updateMany(
//             {}, 
//             { $set: { sourceStatus: "CREATED_WITHOUT_ORDER_MATERIAL" } }
//         );

//         const billUpdate = await BillAccountModel.updateMany(
//             {}, 
//             { $set: { sourceStatus: "CREATED_WITHOUT_ORDER_MATERIAL" } }
//         );

//         console.log("✅ Migration Successful!");
//         console.log(`📊 Payments Updated: ${paymentUpdate.modifiedCount}`);
//         console.log(`📊 Bills Updated: ${billUpdate.modifiedCount}`);

//     } catch (error) {
//         console.error("❌ Migration Failed:", error);
//     }
// };

// Call it immediately (Ensure this happens AFTER your DB connection is established)
// runOneTimeAccountingMigration();