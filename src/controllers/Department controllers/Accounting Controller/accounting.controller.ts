// utils/accountingUtils.ts

import { Request, Response } from "express";
import { AccountingModel, IInstallmentAcc } from "../../../models/Department Models/Accounting Model/accountingMain.model";
import { RoleBasedRequest } from "../../../types/types";
import mongoose, { Types } from "mongoose"
import Razorpay from "razorpay";
import crypto from 'crypto';
import { getDecryptedRazorpayConfig } from "../../RazoryPay_controllers/razorpay.controllers";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function generateTransactionNumber(organizationId: string | Types.ObjectId): Promise<string> {
  // Find last transaction for this org
  const lastDoc = await AccountingModel.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("transactionNumber");

  let nextNumber = 1;

  if (lastDoc?.transactionNumber) {
    const match = lastDoc.transactionNumber.match(/ACC-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ACC-${String(nextNumber).padStart(3, "0")}`;
}

// This is the main utility you’ll call from logistics/procurement
export async function createAccountingEntry({
  organizationId,
  projectId,
  fromDept,
  subContractId,
  totalCost,
  upiId,
  installMents
}: {
  organizationId: string;
  projectId?: string;
  subContractId?: string | null;
  fromDept: "logistics" | "procurement" | "hr" | "factory";
  totalCost: number;
  upiId?: string | null,
  installMents?: IInstallmentAcc[];
}) {
  const transactionNumber = await generateTransactionNumber(organizationId);


  if (installMents && (!Array.isArray(installMents) || installMents?.length === 0)) {
    throw new Error("installments should be an array, and it must contain atleast one schedule");
  }


  const validatedInstallments = installMents ? installMents.map(schl => {

    return ({
      _id: new mongoose.Types.ObjectId(),
      amount: schl.amount,
      dueDate: schl.dueDate,
      status: "pending",
      orderId: "",
      paymentId: "",
    })
  }) : []


  const doc = await AccountingModel.create({
    organizationId,
    projectId,
    fromDept,
    transactionNumber,
    totalAmount: {
      amount: totalCost,
      taxAmount: 0
    },
    upiId,
    transactionType: "payment",
    status: "pending",
    // ...(subContractId && installMents ? { installMents } : {})  // <--- only if subcontract
    installMents: validatedInstallments
  });

  return doc;
}


export const updateAccountingTransaction = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // transaction _id
    const updates = req.body;  // allowed fields from frontend

    // only allow these fields to be updated
    // const allowedUpdates = [
    //   "transactionType",
    //   "fromDept",
    //   "totalAmount",
    //   "status",
    //   "dueDate",
    //   "notes",
    //   "paidAt"
    // ];

    // const filteredUpdates: any = {};
    // for (const key of allowedUpdates) {
    //   if (updates[key] !== undefined) {
    //     filteredUpdates[key] = updates[key];
    //   }
    // }


    // ✅ Conditionally enforce logic
    if (updates?.status === "paid") {
      updates.paidAt = new Date(); // auto-set current date
    }

    // If status is moved away from "paid", reset paidAt
    if (updates?.status && updates.status !== "paid") {
      updates.paidAt = null;
    }

    const updatedTransaction = await AccountingModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ ok: false, message: "Transaction not found" });
    }

    res.status(200).json({
      ok: true,
      data: updatedTransaction
    });
  } catch (err: any) {
    console.error("Error updating accounting transaction:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};




export const addInstallments = async (req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params; // accounting _id
    const installments = req.body; // array of installments


    if (!id) {
      return res.status(404).json({ ok: false, message: "id is required" });
    }


    if (!Array.isArray(installments) || installments?.length === 0) return res.status(404).json({ ok: false, message: "installments should be an arra, and it must contain atleast one schedule" });



    const validatedInstallments = installments.map(schl => {

      return ({
        _id: new mongoose.Types.ObjectId(),
        amount: schl.amount,
        dueDate: schl.dueDate,
        status: "pending",
        orderId: "",
        paymentId: "",
        transactionId: "",
        paidAt: null,
        failureReason: null,
        fees: null,
        tax: null
      })
    })

    const acc = await AccountingModel.findById(id);

    if (!acc) return res.status(404).json({ ok: false, message: "Transaction not found" });

    if(acc.installMents) {
      acc.installMents = [...acc.installMents, ...validatedInstallments];
    }else{
      acc.installMents = validatedInstallments
    }
    await acc.save();

    return res.status(200).json({ ok: true, message: "installments updated successfully", data: acc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


export const deleteAccounting = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params; // accounting doc _id

    if (!id) {
      return res.status(400).json({ message: "id and organizationId are required", ok: false });
    }

    const deleted = await AccountingModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Accounting record not found", ok: false });
    }

    return res.status(200).json({ message: "Deleted successfully", data: deleted, ok: true });
  } catch (err) {
    console.error("deleteAccounting error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};

export const getAccounting = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { projectId, fromDept, status, organizationId, search } = req.query;

    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required", ok: false });
    }

    const filter: any = { organizationId };

    if (projectId) filter.projectId = projectId;
    if (fromDept) filter.fromDept = fromDept;
    if (status) filter.status = status;


    // 🔍 Search functionality
    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search, "i"); // case-insensitive match

      filter.$or = [
        { transactionNumber: searchRegex },
        { transactionType: searchRegex },
        { fromDept: searchRegex },
        { upiId: searchRegex },
        { status: searchRegex },
        { notes: searchRegex },
      ];
    }

    const records = await AccountingModel.find(filter);

    return res.status(200).json({ ok: true, message: "got the data", data: records });
  } catch (err) {
    console.error("getAccounting error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};



// ✅ Get single accounting record
export const getSingleAccounting = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const record = await AccountingModel.findById(id);
    if (!record) {
      return res.status(404).json({ ok: false, message: "Accounting record not found" });
    }

    res.status(200).json({ ok: true, data: record, message: "got single data" });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};




// PAYMENT FROM ACCOUNTING


export const createAccountInstallmentOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accountingId, installmentId } = req.params;

    const acc = await AccountingModel.findById(accountingId);
    if (!acc || !acc.installMents || !acc.installMents.length) {
      return res.status(404).json({ ok: false, message: "Installments not created" });
    }

    const installment = (acc.installMents as any).id(installmentId);

    if (!installment) {
      return res.status(404).json({ ok: false, message: "Installment not found" });
    }


    if (installment.status === "paid")
      return res.status(400).json({ ok: false, message: "Installment already paid" });

    const amountInPaise = installment.amount * 100;


    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `installment_${Date.now()}`
    });

    installment.orderId = order.id;
    // installment.clientId = clientId;
    installment.status = "created";
    await acc.save();

    return res.status(200).json({
      ok: true,
      message: "Order created",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });

  } catch (err: any) {
    console.log("error", err)
    return res.status(500).json({ ok: false, message: err.message });
  }
};




export const verifyAccountsInstallmentPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accId, installmentId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const acc = await AccountingModel.findById(accId);
    if (!acc) return res.status(404).json({ ok: false, message: "Transaction not found" });


    const installment = acc.installMents!.find(inst => (inst as any)._id.toString() === installmentId);
    if (!installment) return res.status(404).json({ ok: false, message: "Installment not found" });

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ ok: false, message: "Payment verification failed" });
    }

    installment.status = "paid";
    installment.paymentId = razorpay_payment_id;
    // installment.paidAt = new Date();

    await acc.save();

    return res.status(200).json({
      ok: true,
      message: "Installment paid successfully",
      data: installment
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};




//  NEW SERVICES FOR PAYOUTS




interface PayoutData {
  amount: number; // in INR
  vendorUpiId: string;
  purpose: string;
  reference_id: string; // e.g., installmentId
  narration: string;
}

export const createVendorPayout = async (
  organizationId: string,
  payoutData: PayoutData
) => {
  try {
    // Get decrypted RazorpayX credentials
    const config = await getDecryptedRazorpayConfig(organizationId);

    if (!config.razorpayXKeyId || !config.razorpayXKeySecret || !config.razorpayXAccountNumber) {
      throw new Error("RazorpayX is not configured for this organization");
    }

    // Initialize RazorpayX
    const razorpayX: any = new Razorpay({
      key_id: config.razorpayXKeyId,
      key_secret: config.razorpayXKeySecret
    });

    // Create payout
    const payout = await razorpayX.payouts.create({
      account_number: config.razorpayXAccountNumber,
      amount: Math.round(payoutData.amount * 100), // Convert to paise
      currency: "INR",
      mode: "UPI",
      purpose: payoutData.purpose, // e.g., "payout", "vendor_payment"
      fund_account: {
        account_type: "vpa",
        vpa: {
          address: payoutData.vendorUpiId
        }
      },
      queue_if_low_balance: false,
      reference_id: payoutData.reference_id,
      narration: payoutData.narration // Shows in bank statement
    });

    return {
      success: true,
      payoutId: payout.id,
      orderId: payout.fund_account_id,
      status: payout.status, // "processing", "processed", "reversed", "cancelled"
      utr: payout.utr, // UTR number (available after processing)
      amount: payout.amount / 100,
      fees: payout.fees / 100,
      tax: payout.tax / 100
    };

  } catch (error: any) {
    console.error("Payout creation failed:", error);
    throw new Error(error.error?.description || error.message || "Payout failed");
  }
};

// Check payout status
export const getPayoutStatus = async (
  organizationId: string,
  payoutId: string
) => {
  try {
    const config = await getDecryptedRazorpayConfig(organizationId);

    const razorpayX: any = new Razorpay({
      key_id: config.razorpayXKeyId!,
      key_secret: config.razorpayXKeySecret!
    });

    const payout = await razorpayX.payouts.fetch(payoutId);

    return {
      payoutId: payout.id,
      status: payout.status,
      utr: payout.utr,
      amount: payout.amount / 100,
      processedAt: payout.processed_at
    };

  } catch (error: any) {
    throw new Error(error.error?.description || "Failed to fetch payout status");
  }
};


//  CONTROLLER 


export const payInstallment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accountingId, installmentId } = req.params;

    // Find the accounting record
    const accounting = await AccountingModel.findById(accountingId);

    if (!accounting) {
      return res.status(404).json({ ok: false, message: "Accounting record not found" });
    }

    // Find the installment
    const installment = (accounting.installMents as any).id(installmentId);

    if (!installment) {
      return res.status(404).json({ ok: false, message: "Installment not found" });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({ ok: false, message: "Installment already paid" });
    }

    if (!accounting.upiId) {
      return res.status(400).json({ ok: false, message: "Vendor UPI ID not found" });
    }

    // Create payout
    const payoutResult = await createVendorPayout(
      accounting.organizationId.toString(),
      {
        amount: installment.amount!,
        vendorUpiId: accounting.upiId,
        purpose: "vendor_payment",
        reference_id: installmentId.toString(),
        narration: `Payment for ${accounting.transactionNumber || 'Invoice'}`
      }
    );

    // Update installment
    installment.status = payoutResult.status === 'processed' ? 'paid' : 'processing';
    installment.paymentId = payoutResult.payoutId;
    installment.orderId = payoutResult.orderId;
    installment.transactionId = payoutResult.utr || null;
    installment.fees = payoutResult.fees;
    installment.tax = payoutResult.tax;

    if (payoutResult.status === 'processed') {
      installment.paidAt = new Date();
    }

    await accounting.save();

    // Update overall status
    const allPaid = accounting.installMents!.every(inst => inst.status === 'paid');
    const somePaid = accounting.installMents!.some(inst => inst.status === 'paid');

    if (allPaid) {
      accounting.status = 'paid';
      accounting.paidAt = new Date();
    } else if (somePaid) {
      accounting.status = 'pending';
    }

    await accounting.save();

    return res.json({
      ok: true,
      message: "Payout initiated successfully",
      data: {
        payoutId: payoutResult.payoutId,
        status: payoutResult.status,
        installment: installment
      }
    });

  } catch (error: any) {
    console.error("Installment payment error:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
};

// Check and update payout status
export const checkAccPayoutStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { accountingId, installmentId } = req.params;

    const accounting = await AccountingModel.findById(accountingId);
    if (!accounting) {
      return res.status(404).json({ ok: false, message: "Accounting record not found" });
    }

    const installment = (accounting.installMents as any).id(installmentId);
    if (!installment || !installment.paymentId) {
      return res.status(404).json({ ok: false, message: "Installment or payment not found" });
    }

    // const { getPayoutStatus } = await import("../services/razorpayPayout.service");

    const payoutStatus = await getPayoutStatus(
      accounting.organizationId.toString(),
      installment.paymentId
    );

    // Update installment status
    if (payoutStatus.status === 'processed') {
      installment.status = 'paid';
      installment.paidAt = new Date();
      installment.transactionId = payoutStatus.utr || null;
    } else if (payoutStatus.status === 'reversed' || payoutStatus.status === 'cancelled') {
      installment.status = 'failed';
      installment.failureReason = payoutStatus.status;
    }

    await accounting.save();

    return res.json({
      ok: true,
      data: {
        status: payoutStatus.status,
        utr: payoutStatus.utr,
        installment: installment
      }
    });

  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};