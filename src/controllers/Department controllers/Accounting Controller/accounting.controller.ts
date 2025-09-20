// utils/accountingUtils.ts

import { Request, Response } from "express";
import { AccountingModel } from "../../../models/Department Models/Accounting Model/accounting.model";
import { RoleBasedRequest } from "../../../types/types";

export async function generateTransactionNumber(organizationId: string): Promise<string> {
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
  totalCost,
  upiId,
}: {
  organizationId: string;
  projectId?: string;
  fromDept: "logistics" | "procurement" | "hr" | "factory";
  totalCost: number;
  upiId?:string | null
}) {
  const transactionNumber = await generateTransactionNumber(organizationId);

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
    status: "pending"
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
  } catch (err:any) {
    console.error("Error updating accounting transaction:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};


export const deleteAccounting = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params; // accounting doc _id

    if (!id ) {
      return res.status(400).json({ message: "id and organizationId are required", ok:false });
    }

    const deleted = await AccountingModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Accounting record not found", ok:false });
    }

    return res.status(200).json({ message: "Deleted successfully", data:deleted, ok:true });
  } catch (err) {
    console.error("deleteAccounting error:", err);
    return res.status(500).json({ message: "Internal server error", ok:false });
  }
};

export const getAccounting = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {
    const { projectId, fromDept, status, organizationId , search} = req.query;

    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is required" , ok:false});
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

    return res.status(200).json({ ok:true, message:"got the data", data:records });
  } catch (err) {
    console.error("getAccounting error:", err);
    return res.status(500).json({ message: "Internal server error" , ok:false});
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

    res.status(200).json({ ok: true, data: record, message:"got single data" });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};