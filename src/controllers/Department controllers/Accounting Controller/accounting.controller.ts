// // utils/accountingUtils.ts

// import { Request, Response } from "express";
// import { AccountingModel, IInstallmentAcc } from "../../../models/Department Models/Accounting Model/accountingMain.model";
// import { RoleBasedRequest } from "../../../types/types";
// import mongoose, { Types } from "mongoose"
// import Razorpay from "razorpay";
// import crypto from 'crypto';
// import { getDecryptedRazorpayConfig } from "../../RazoryPay_controllers/razorpay.controllers";
// import { BillAccountModel } from "../../../models/Department Models/Accounting Model/billAccount.model";

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });


// export async function generateTransactionNumber(organizationId: string | Types.ObjectId): Promise<string> {
//   // Find last transaction for this org
//   const lastDoc = await AccountingModel.findOne({ organizationId })
//     .sort({ createdAt: -1 })
//     .select("transactionNumber");

//   let nextNumber = 1;

//   if (lastDoc?.transactionNumber) {
//     const match = lastDoc.transactionNumber.match(/ACC-(\d+)/);
//     if (match) {
//       nextNumber = parseInt(match[1], 10) + 1;
//     }
//   }

//   return `ACC-${String(nextNumber).padStart(3, "0")}`;
// }

// // This is the main utility you’ll call from logistics/procurement
// export async function createAccountingEntry({
//   organizationId,
//   projectId,
//   fromDept,
//   subContractId,
//   totalCost,
//   upiId,
//   installMents
// }: {
//   organizationId: string;
//   projectId?: string;
//   subContractId?: string | null;
//   fromDept: "logistics" | "procurement" | "hr" | "factory";
//   totalCost: number;
//   upiId?: string | null,
//   installMents?: IInstallmentAcc[];
// }) {
//   const transactionNumber = await generateTransactionNumber(organizationId);


//   if (installMents && (!Array.isArray(installMents) || installMents?.length === 0)) {
//     throw new Error("installments should be an array, and it must contain atleast one schedule");
//   }


//   const validatedInstallments = installMents ? installMents.map(schl => {

//     return ({
//       _id: new mongoose.Types.ObjectId(),
//       amount: schl.amount,
//       dueDate: schl.dueDate,
//       status: "pending",
//       orderId: "",
//       paymentId: "",
//     })
//   }) : []


//   const doc = await AccountingModel.create({
//     organizationId,
//     projectId,
//     fromDept,
//     transactionNumber,
//     totalAmount: {
//       amount: totalCost,
//       taxAmount: 0
//     },
//     upiId,
//     transactionType: "payment",
//     status: "pending",
//     // ...(subContractId && installMents ? { installMents } : {})  // <--- only if subcontract
//     installMents: validatedInstallments
//   });

//   return doc;
// }



// export const updateAccountingTransaction = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//   try {
//     const { id } = req.params; // transaction _id
//     const updates = req.body;  // allowed fields from frontend

//     // only allow these fields to be updated
//     // const allowedUpdates = [
//     //   "transactionType",
//     //   "fromDept",
//     //   "totalAmount",
//     //   "status",
//     //   "dueDate",
//     //   "notes",
//     //   "paidAt"
//     // ];

//     // const filteredUpdates: any = {};
//     // for (const key of allowedUpdates) {
//     //   if (updates[key] !== undefined) {
//     //     filteredUpdates[key] = updates[key];
//     //   }
//     // }


//     // ✅ Conditionally enforce logic
//     if (updates?.status === "paid") {
//       updates.paidAt = new Date(); // auto-set current date
//     }

//     // If status is moved away from "paid", reset paidAt
//     if (updates?.status && updates.status !== "paid") {
//       updates.paidAt = null;
//     }

//     const updatedTransaction = await AccountingModel.findByIdAndUpdate(
//       id,
//       { $set: updates },
//       { new: true }
//     );

//     if (!updatedTransaction) {
//       return res.status(404).json({ ok: false, message: "Transaction not found" });
//     }

//     res.status(200).json({
//       ok: true,
//       data: updatedTransaction
//     });
//   } catch (err: any) {
//     console.error("Error updating accounting transaction:", err);
//     res.status(500).json({ ok: false, message: err.message });
//   }
// };




// export const addInstallments = async (req: RoleBasedRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params; // accounting _id
//     const installments = req.body; // array of installments


//     if (!id) {
//       return res.status(404).json({ ok: false, message: "id is required" });
//     }


//     if (!Array.isArray(installments) || installments?.length === 0) return res.status(404).json({ ok: false, message: "installments should be an arra, and it must contain atleast one schedule" });



//     const validatedInstallments = installments.map(schl => {

//       return ({
//         _id: new mongoose.Types.ObjectId(),
//         amount: schl.amount,
//         dueDate: schl.dueDate,
//         status: "pending",
//         orderId: "",
//         paymentId: "",
//         transactionId: "",
//         paidAt: null,
//         failureReason: null,
//         fees: null,
//         tax: null
//       })
//     })

//     const acc = await AccountingModel.findById(id);

//     if (!acc) return res.status(404).json({ ok: false, message: "Transaction not found" });

//     if (acc.installMents) {
//       acc.installMents = [...acc.installMents, ...validatedInstallments];
//     } else {
//       acc.installMents = validatedInstallments
//     }
//     await acc.save();

//     return res.status(200).json({ ok: true, message: "installments updated successfully", data: acc });
//   } catch (err: any) {
//     res.status(500).json({ ok: false, message: err.message });
//   }
// };


// export const deleteAccounting = async (
//   req: RoleBasedRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params; // accounting doc _id

//     if (!id) {
//       return res.status(400).json({ message: "id and organizationId are required", ok: false });
//     }

//     const deleted = await AccountingModel.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ message: "Accounting record not found", ok: false });
//     }

//     return res.status(200).json({ message: "Deleted successfully", data: deleted, ok: true });
//   } catch (err) {
//     console.error("deleteAccounting error:", err);
//     return res.status(500).json({ message: "Internal server error", ok: false });
//   }
// };

// export const getAccounting = async (
//   req: RoleBasedRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { projectId, fromDept, status, organizationId, search } = req.query;

//     if (!organizationId) {
//       return res.status(400).json({ message: "organizationId is required", ok: false });
//     }

//     const filter: any = { organizationId };

//     if (projectId) filter.projectId = projectId;
//     if (fromDept) filter.fromDept = fromDept;
//     if (status) filter.status = status;


//     // 🔍 Search functionality
//     if (search && typeof search === "string") {
//       const searchRegex = new RegExp(search, "i"); // case-insensitive match

//       filter.$or = [
//         { transactionNumber: searchRegex },
//         { transactionType: searchRegex },
//         { fromDept: searchRegex },
//         { upiId: searchRegex },
//         { status: searchRegex },
//         { notes: searchRegex },
//       ];
//     }

//     const records = await AccountingModel.find(filter);

//     return res.status(200).json({ ok: true, message: "got the data", data: records });
//   } catch (err) {
//     console.error("getAccounting error:", err);
//     return res.status(500).json({ message: "Internal server error", ok: false });
//   }
// };



// // ✅ Get single accounting record
// export const getSingleAccounting = async (
//   req: RoleBasedRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;

//     const record = await AccountingModel.findById(id);
//     if (!record) {
//       return res.status(404).json({ ok: false, message: "Accounting record not found" });
//     }

//     res.status(200).json({ ok: true, data: record, message: "got single data" });
//   } catch (error: any) {
//     res.status(500).json({ ok: false, message: error.message });
//   }
// };




// // PAYMENT FROM ACCOUNTING


// export const createAccountInstallmentOrder = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { accountingId, installmentId } = req.params;

//     const acc = await AccountingModel.findById(accountingId);
//     if (!acc || !acc.installMents || !acc.installMents.length) {
//       return res.status(404).json({ ok: false, message: "Installments not created" });
//     }

//     const installment = (acc.installMents as any).id(installmentId);

//     if (!installment) {
//       return res.status(404).json({ ok: false, message: "Installment not found" });
//     }


//     if (installment.status === "paid")
//       return res.status(400).json({ ok: false, message: "Installment already paid" });

//     const amountInPaise = installment.amount * 100;


//     const order = await razorpayInstance.orders.create({
//       amount: amountInPaise,
//       currency: "INR",
//       receipt: `installment_${Date.now()}`
//     });

//     installment.orderId = order.id;
//     // installment.clientId = clientId;
//     installment.status = "created";
//     await acc.save();

//     return res.status(200).json({
//       ok: true,
//       message: "Order created",
//       data: {
//         orderId: order.id,
//         amount: order.amount,
//         currency: order.currency
//       }
//     });

//   } catch (err: any) {
//     console.log("error", err)
//     return res.status(500).json({ ok: false, message: err.message });
//   }
// };




// export const verifyAccountsInstallmentPayment = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { accId, installmentId } = req.params;
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     const acc = await AccountingModel.findById(accId);
//     if (!acc) return res.status(404).json({ ok: false, message: "Transaction not found" });


//     const installment = acc.installMents!.find(inst => (inst as any)._id.toString() === installmentId);
//     if (!installment) return res.status(404).json({ ok: false, message: "Installment not found" });

//     const generated_signature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//       .update(razorpay_order_id + "|" + razorpay_payment_id)
//       .digest("hex");

//     if (generated_signature !== razorpay_signature) {
//       return res.status(400).json({ ok: false, message: "Payment verification failed" });
//     }

//     installment.status = "paid";
//     installment.paymentId = razorpay_payment_id;
//     // installment.paidAt = new Date();

//     await acc.save();

//     return res.status(200).json({
//       ok: true,
//       message: "Installment paid successfully",
//       data: installment
//     });
//   } catch (err: any) {
//     console.log(err);
//     return res.status(500).json({ ok: false, message: err.message });
//   }
// };




// //  NEW SERVICES FOR PAYOUTS




// interface PayoutData {
//   amount: number; // in INR
//   vendorUpiId: string;
//   purpose: string;
//   reference_id: string; // e.g., installmentId
//   narration: string;
// }

// export const createVendorPayout = async (
//   organizationId: string,
//   payoutData: PayoutData
// ) => {
//   try {
//     // Get decrypted RazorpayX credentials
//     const config = await getDecryptedRazorpayConfig(organizationId);

//     if (!config.razorpayXKeyId || !config.razorpayXKeySecret || !config.razorpayXAccountNumber) {
//       throw new Error("RazorpayX is not configured for this organization");
//     }

//     // Initialize RazorpayX
//     const razorpayX: any = new Razorpay({
//       key_id: config.razorpayXKeyId,
//       key_secret: config.razorpayXKeySecret
//     });

//     // Create payout
//     const payout = await razorpayX.payouts.create({
//       account_number: config.razorpayXAccountNumber,
//       amount: Math.round(payoutData.amount * 100), // Convert to paise
//       currency: "INR",
//       mode: "UPI",
//       purpose: payoutData.purpose, // e.g., "payout", "vendor_payment"
//       fund_account: {
//         account_type: "vpa",
//         vpa: {
//           address: payoutData.vendorUpiId
//         }
//       },
//       queue_if_low_balance: false,
//       reference_id: payoutData.reference_id,
//       narration: payoutData.narration // Shows in bank statement
//     });

//     return {
//       ok: true,
//       payoutId: payout.id,
//       orderId: payout.fund_account_id,
//       status: payout.status, // "processing", "processed", "reversed", "cancelled"
//       utr: payout.utr, // UTR number (available after processing)
//       amount: payout.amount / 100,
//       fees: payout.fees / 100,
//       tax: payout.tax / 100
//     };

//   } catch (error: any) {
//     console.error("Payout creation failed:", error);
//     throw new Error(error.error?.description || error.message || "Payout failed");
//   }
// };

// // Check payout status
// export const getPayoutStatus = async (
//   organizationId: string,
//   payoutId: string
// ) => {
//   try {
//     const config = await getDecryptedRazorpayConfig(organizationId);

//     const razorpayX: any = new Razorpay({
//       key_id: config.razorpayXKeyId!,
//       key_secret: config.razorpayXKeySecret!
//     });

//     const payout = await razorpayX.payouts.fetch(payoutId);

//     return {
//       payoutId: payout.id,
//       status: payout.status,
//       utr: payout.utr,
//       amount: payout.amount / 100,
//       processedAt: payout.processed_at
//     };

//   } catch (error: any) {
//     throw new Error(error.error?.description || "Failed to fetch payout status");
//   }
// };


// //  CONTROLLER 


// export const payInstallment = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { accountingId, installmentId } = req.params;

//     // Find the accounting record
//     const accounting = await AccountingModel.findById(accountingId);

//     if (!accounting) {
//       return res.status(404).json({ ok: false, message: "Accounting record not found" });
//     }

//     // Find the installment
//     const installment = (accounting.installMents as any).id(installmentId);

//     if (!installment) {
//       return res.status(404).json({ ok: false, message: "Installment not found" });
//     }

//     if (installment.status === 'paid') {
//       return res.status(400).json({ ok: false, message: "Installment already paid" });
//     }

//     if (!accounting.upiId) {
//       return res.status(400).json({ ok: false, message: "Vendor UPI ID not found" });
//     }

//     // Create payout
//     const payoutResult = await createVendorPayout(
//       accounting.organizationId.toString(),
//       {
//         amount: installment.amount!,
//         vendorUpiId: accounting.upiId,
//         purpose: "vendor_payment",
//         reference_id: installmentId.toString(),
//         narration: `Payment for ${accounting.transactionNumber || 'Invoice'}`
//       }
//     );

//     // Update installment
//     installment.status = payoutResult.status === 'processed' ? 'paid' : 'processing';
//     installment.paymentId = payoutResult.payoutId;
//     installment.orderId = payoutResult.orderId;
//     installment.transactionId = payoutResult.utr || null;
//     installment.fees = payoutResult.fees;
//     installment.tax = payoutResult.tax;

//     if (payoutResult.status === 'processed') {
//       installment.paidAt = new Date();
//     }

//     await accounting.save();

//     // Update overall status
//     const allPaid = accounting.installMents!.every(inst => inst.status === 'paid');
//     const somePaid = accounting.installMents!.some(inst => inst.status === 'paid');

//     if (allPaid) {
//       accounting.status = 'paid';
//       accounting.paidAt = new Date();
//     } else if (somePaid) {
//       accounting.status = 'pending';
//     }

//     await accounting.save();

//     return res.json({
//       ok: true,
//       message: "Payout initiated successfully",
//       data: {
//         payoutId: payoutResult.payoutId,
//         status: payoutResult.status,
//         installment: installment
//       }
//     });

//   } catch (error: any) {
//     console.error("Installment payment error:", error);
//     res.status(500).json({ ok: false, message: error.message });
//   }
// };

// // Check and update payout status
// export const checkAccPayoutStatus = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { accountingId, installmentId } = req.params;

//     const accounting = await AccountingModel.findById(accountingId);
//     if (!accounting) {
//       return res.status(404).json({ ok: false, message: "Accounting record not found" });
//     }

//     const installment = (accounting.installMents as any).id(installmentId);
//     if (!installment || !installment.paymentId) {
//       return res.status(404).json({ ok: false, message: "Installment or payment not found" });
//     }

//     // const { getPayoutStatus } = await import("../services/razorpayPayout.service");

//     const payoutStatus = await getPayoutStatus(
//       accounting.organizationId.toString(),
//       installment.paymentId
//     );

//     // Update installment status
//     if (payoutStatus.status === 'processed') {
//       installment.status = 'paid';
//       installment.paidAt = new Date();
//       installment.transactionId = payoutStatus.utr || null;
//     } else if (payoutStatus.status === 'reversed' || payoutStatus.status === 'cancelled') {
//       installment.status = 'failed';
//       installment.failureReason = payoutStatus.status;
//     }

//     await accounting.save();

//     return res.json({
//       ok: true,
//       data: {
//         status: payoutStatus.status,
//         utr: payoutStatus.utr,
//         installment: installment
//       }
//     });

//   } catch (error: any) {
//     res.status(500).json({ ok: false, message: error.message });
//   }
// };


import { Request, Response } from "express";
import { AccountingModel, IAccounting } from "../../../models/Department Models/Accounting Model/accountingMain.model";
import { RoleBasedRequest } from "../../../types/types";
import mongoose, { FilterQuery, Types } from "mongoose"
import Razorpay from "razorpay";
import crypto from 'crypto';
import { getDecryptedRazorpayConfig } from "../../RazoryPay_controllers/razorpay.controllers";
import { BillAccountModel } from "../../../models/Department Models/Accounting Model/billAccount.model";
import { IVendorPaymentItems } from "../../../models/Department Models/Accounting Model/vendorPaymentAcc.model";



export async function generateTransactionNumber(organizationId: string | Types.ObjectId): Promise<string> {
  // Find last transaction for this org

  const currentYear = new Date().getFullYear();


  const lastDoc = await AccountingModel.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("recordNumber");

  let nextNumber = 1;

  if (lastDoc?.recordNumber) {
    const match = lastDoc.recordNumber.match(new RegExp(`ACC-${currentYear}-(\\d+)$`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ACC-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
}





export const syncAccountingRecord = async (
  data: {
    organizationId: any;
    projectId?: any;

    // Source (Bill/Expense)
    referenceId: any;
    referenceModel: string | null;

    // Payment (Optional - passed only when creating payment)
    paymentId?: any;

    deptGeneratedDate?: Date | null;
    deptNumber: string | null;
    deptDueDate: Date | null;

    deptRecordFrom: "Retail Invoice" | "Invoice" | "Bill" | "Expense" | "Vendor Payment" | "Procurement" | null;   //bill, expense, subcontract

    orderMaterialDeptNumber?: string | null;
    orderMaterialRefId?: string | null

    assoicatedPersonName?: string;
    assoicatedPersonId?: any | null;
    assoicatedPersonModel?: string | null;
    amount?: number;
    status?: string | null;
    notes?: string;
  },
  // session: mongoose.ClientSession | null = null
) => {
  try {
    // 1. Try to find existing Ledger for this Source (Bill/Expense)
    const existingRecord = await AccountingModel.findOne({
      referenceId: data.referenceId,
      referenceModel: data.referenceModel
    })

    // 2. Prepare Payload
    let payload: any = { ...data };

    // 3. If updating existing record (e.g., adding Payment ID)
    if (existingRecord) {
      // If we are passing a paymentId, ensure we update it
      if (data.paymentId) {
        payload.paymentId = data.paymentId;
      }
      // Keep existing record number
      payload.recordNumber = existingRecord.recordNumber;
    }
    // 4. If creating new record
    else {
      payload.recordNumber = await generateTransactionNumber(data.organizationId);
    }

    // 5. Upsert
    const result = await AccountingModel.findOneAndUpdate(
      {
        referenceId: data.referenceId,
        referenceModel: data.referenceModel
      },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("result from the syncAccountingRecord", result)

    return result;
  } catch (error) {
    console.error("Error syncing ledger:", error);
    throw error;
  }
};


// helper to format the response


const formatLedgerItem = (item: any) => {
  const source = item.referenceId || {}; // Populated Bill, Invoice, or Expense
  const payment = item.paymentId || {};  // Populated Payment

  // 1. NORMALIZE SOURCE FIELDS
  // We map specific fields from different models to a common standard
  let docNumber = "N/A";
  let docDate = null;
  let docDueDate = null;
  let docItems: any[] = [];
  let docTotal = 0;
  let docTax = 0;
  let docDiscount = 0;
  let docNotes = "";
  let docTaxPercent = 0
  let docDiscountPercent = 0

  // Check type based on deptRecordFrom
  const type = item.deptRecordFrom; // "Bill", "Invoice", "Expense"

  if (type === "Bill") {
    docNumber = source.billNumber;
    docDate = source.billDate;
    docDueDate = source.dueDate;
    docItems = source.items || [];
    docTotal = source.grandTotal;
    docTax = source.taxAmount;
    docDiscount = source.discountAmount;
    docTaxPercent = source.taxPercentage;
    docDiscountPercent = source.discountPercentage;
    docNotes = source.notes;

  }
  else if (type === "Invoice" || type === "Retail Invoice") {
    docNumber = source.invoiceNumber || source.retailInvoiceNumber;
    docDate = source.invoiceDate;
    docDueDate = source.dueDate;
    docItems = source.items || [];
    docTotal = source.grandTotal;
    docTax = source.taxAmount;
    docDiscount = source.discountAmount;
    docTaxPercent = source.taxPercentage;
    docDiscountPercent = source.discountPercentage;
    docNotes = source.customerNotes;
  }
  else if (type === "Expense") {
    docNumber = source.expenseNumber;
    docDate = source.expenseDate;
    docItems = source.items || []; // Some expenses might not have items
    docTotal = source.amount;
    docNotes = source.notes;
  } else if (type === "Vendor Payment") {
    docNumber = source.paymentNumber;
    docDate = source.vendorPaymentDate;

    const convertedItems = source.items.map((item: IVendorPaymentItems) => {
      return (
        {
          itemName: item.itemName,
          unit: "nos",
          quantity: 1,
          rate: item.billAmount,
          totalCost: item.billAmount,
        }
      )
    })

    docItems = convertedItems || []; // Some expenses might not have items
    docTotal = source.amount;
    docNotes = source.notes;
  }

  // 2. NORMALIZE PAYMENT DATA
  // Invoices usually represent money coming IN, so they might not have a 'paymentId' 
  // linked in the same way as Bills (money going OUT).
  // We only show payment details if it exists.
  const paymentDetails = item.paymentId ? {
    id: payment._id,
    number: payment.paymentNumber,
    date: payment.paymentDate,
    status: payment.generalStatus,
    orderId: payment.orderId,
    transactionId: payment.transactionId,
    amountPaid: payment.grandTotal,
    // We include items here so you can compare Source Items vs Payment Items
    items: payment.items || []
  } : null;

  // 3. DETERMINE STATUS
  const currentStatus = payment.generalStatus || item.status || source.status || 'pending';

  return {
    _id: item._id,
    recordNumber: item.recordNumber,
    createdAt: item.createdAt,

    // High Level Info
    type: type,
    amount: item.amount,
    status: currentStatus,

    // Person Info
    person: {
      name: item.assoicatedPersonName,
      id: item.assoicatedPersonId,
      model: item.assoicatedPersonModel
    },

    // UNIFIED SOURCE DETAILS (The standard object for Frontend)
    sourceDetails: {
      id: source._id,
      model: item.referenceModel,
      deptFrom: item.deptRecordFrom,
      // Standardized Fields
      deptNumber: docNumber, // Normalized Number
      deptGeneratedDate: docDate,     // Normalized Date
      deptDueDate: docDueDate,

      // Financials
      grandTotal: docTotal,
      taxAmount: docTax,

      // Content
      items: docItems, // <--- The Items Array
      notes: docNotes
    },

    // PAYMENT DETAILS (Nullable)
    paymentDetails: paymentDetails
  };
};



// OLD VERSION
// const formatLedgerItem = (item: IAccounting) => {
//   const source: any = item.referenceId || {}; // The Bill/Expense Doc
//   const payment: any = item.paymentId || {};  // The Payment Doc

//   // Determine Status: Trust Payment Model first, then Ledger, then Bill
//   const currentStatus = payment.generalStatus || item.status || source.status || 'pending';



//   return {
//     _id: item._id,
//     recordNumber: item.recordNumber,
//     createdAt: item.createdAt,

//     // Financials
//     amount: item.amount,
//     status: currentStatus, // Unified Status

//     // Type Info
//     type: item.deptRecordFrom, // "Bill Acc", "Expense Acc"

//     // Source Details (The Bill/Expense/Invoice)
//     sourceDetails: {
//       id: source._id,
//       deptNumber: item.deptNumber,
//       deptGeneratedDate: item.deptGeneratedDate,
//       deptDueDate: item.deptDueDate,
//       createdAt: source.createdAt,
//       model: item.referenceModel
//     },

//     // Payment Details (The Payment Record - Only if exists)
//     paymentDetails: item.paymentId ? {
//       id: payment._id,
//       number: payment.paymentNumber,
//       date: payment.paymentDate,
//       transactionId: payment.transactionId, // UTR etc
//       isPaid: payment.generalStatus === 'paid'
//     } : null,

//     // Person
//     person: {
//       name: item.assoicatedPersonName,
//       id: item.assoicatedPersonId,
//       model: item.assoicatedPersonModel
//     }
//   };
// };



// ==============================================================================
// GET ALL (Updated with Payment Population)
// ==============================================================================export const getAllAccountingRecords = async (req: Request, res: Response): Promise<any> => {
export const getAllAccountingRecords = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      organizationId,
      projectId,
      status,
      // personName,
      deptRecordFrom,

      // Search & Range Filters
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,

      // Pagination
      page = 1,
      limit = 20
    } = req.query;

    // 1. Initialize Filter
    const filter: FilterQuery<IAccounting> = {};

    // --- Basic Filters ---
    if (organizationId) filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId as string);
    if (deptRecordFrom) filter.deptRecordFrom = deptRecordFrom;
    if (status) filter.status = status;

    // Direct Person Name Search (Strict/Regex)
    // if (personName) filter.assoicatedPersonName = { $regex: personName as string, $options: "i" };

    // --- Amount Range Filter ---
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // --- Date Range Filter (Uses new deptGeneratedDate) ---
    if (startDate || endDate) {
      filter.deptGeneratedDate = {};
      if (startDate) filter.deptGeneratedDate.$gte = new Date(startDate as string);
      if (endDate) filter.deptGeneratedDate.$lte = new Date(endDate as string);
    }

    // --- Global Search (Search Box) ---
    // Searches across Number, Name, Internal Record No, and Notes
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      filter.$or = [
        { deptNumber: searchRegex },           // Searches BILL-001, INV-001
        { assoicatedPersonName: searchRegex }, // Searches Vendor/Customer Name
        { recordNumber: searchRegex },         // Searches ACC-REC-001
        // { deptRecordFrom: searchRegex },         // Searches Bill, Retail Invoice, Invoice
        // { notes: searchRegex }
      ];
    }

    // 2. Pagination Calculation
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // 3. Execute Query
    const records = await AccountingModel.find(filter)
      .sort({ createdAt: -1 }) // Sort by the actual transaction date (Bill Date), not createdAt
      .skip(skip)
      .limit(limitNum)
      .populate("projectId", "projectName _id")
      // Populate Source (Bill/Expense) for extra details if needed
      .populate({
        path: "referenceId",
        // We select common fields. Mongoose ignores fields that don't exist on the specific model.
        // select: "billNumber billDate expenseNumber invoiceNumber invoiceDate expenseDate grandTotal amount status dueDate items"
        select: "billNumber billDate expenseNumber invoiceNumber invoiceDate expenseDate amount totalAmount grandTotal taxAmount taxPercentage discountAmount discountPercentage status dueDate items notes customerNotes description terms"

      })
      // Populate Payment Record
      .populate({
        path: "paymentId",
        select: "paymentNumber paymentDate generalStatus transactionId items"
      });

    // 4. Get Total Count (For Pagination)
    const total = await AccountingModel.countDocuments(filter);

    // 5. Format Response
    const formattedData = records.map(record => formatLedgerItem(record));

    return res.status(200).json({
      ok: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: formattedData
    });

  } catch (error: any) {
    console.error("Error in getAllAccountingRecords:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

// ==============================================================================
// GET SINGLE (Detailed View)
// ==============================================================================
export const getSingleAccountingRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    // const record = await AccountingModel.findById(id)
    //   .populate("projectId", "projectName _id")
    //   // Deep population for single view
    //   .populate("referenceId") // Get full Bill details/ expense details also 
    //   .populate("paymentId");  // Get full Payment details

    const record = await AccountingModel.findById(id)
      .populate("projectId", "projectName _id")
      // 1. Populate Reference (Bill, Invoice, or Expense)
      .populate({
        path: "referenceId",
        // Select ALL possible fields across models to ensure we get data regardless of type
        select: "billNumber billDate expenseNumber invoiceNumber invoiceDate expenseDate amount totalAmount grandTotal taxAmount taxPercentage discountAmount discountPercentage status dueDate items notes customerNotes description terms"
      })
      // 2. Populate Payment
      .populate({
        path: "paymentId",
        select: "paymentNumber paymentDate generalStatus transactionId items grandTotal"
      });

    if (!record) {
      return res.status(404).json({ ok: false, message: "Record not found" });
    }



    console.log("record", record?.referenceId)

    return res.status(200).json({
      ok: true,
      data: formatLedgerItem(record), // Formatted Summary
      // We also send raw objects if frontend needs specific fields (like Items list)
      raw: {
        bill: record.referenceId,
        payment: record.paymentId
      }
    });

  } catch (error: any) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};