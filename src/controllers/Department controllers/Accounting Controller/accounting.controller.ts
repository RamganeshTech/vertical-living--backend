// utils/accountingUtils.ts

import { Request, Response } from "express";
import { AccountingModel, IInstallmentAcc } from "../../../models/Department Models/Accounting Model/accountingMain.model";
import { RoleBasedRequest } from "../../../types/types";
import mongoose, { Types } from "mongoose"
import Razorpay from "razorpay";
import crypto from 'crypto';

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
      })
    })

    const acc = await AccountingModel.findById(id);

    if (!acc) return res.status(404).json({ ok: false, message: "Transaction not found" });

    acc.installMents = validatedInstallments;
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


export const createAccountInstallmentOrder = async (req:Request, res:Response):Promise<any> => {
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

  } catch (err:any) {
    console.log("error", err)
    return res.status(500).json({ ok: false, message: err.message });
  }
};




export const verifyAccountsInstallmentPayment = async (req: Request, res: Response):Promise<any> => {
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
   return   res.status(500).json({ ok: false, message: err.message });
  }
};

