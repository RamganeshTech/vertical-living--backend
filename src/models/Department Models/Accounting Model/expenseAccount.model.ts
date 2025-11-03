import mongoose, { Schema, Document, Types } from "mongoose";


export interface IExpenseAccount extends Document {
    organizationId: mongoose.Types.ObjectId;
    vendorId: Types.ObjectId;
    vendorName: string;
    invoiceNumber: string;
    dateOfPayment: Date,
    amount: number;
    paidThrough: string,
    notes: string | null;
}

const ExpenseSchema = new Schema<IExpenseAccount>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel"
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "VendorAccountModel",
        },
        vendorName: { type: String, default: null },
        invoiceNumber: { type: String, },
        dateOfPayment: { type: Date, default: new Date() },
        amount: { type: Number, default: 0 },
        notes: { type: String, default: null },
        paidThrough: { type: String, default: null },
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
ExpenseSchema.pre("save", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const lastDoc = await mongoose
      .model("ExpenseAccountModel")
      .findOne({}, { invoiceNumber: 1 })
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastDoc && lastDoc.invoiceNumber) {
      const match = lastDoc.invoiceNumber.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }

    this.invoiceNumber = `INV-EXP-${String(nextNumber).padStart(4, "0")}`;
  }
  next();
});

export const ExpenseAccountModel = mongoose.model<IExpenseAccount>("ExpenseAccountModel", ExpenseSchema);
