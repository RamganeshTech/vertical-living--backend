import mongoose, { Schema, Document, Types } from "mongoose";


export interface IExpenseAccount extends Document {
    organizationId: mongoose.Types.ObjectId;
    vendorId: Types.ObjectId;
    projectId: Types.ObjectId;
    vendorName: string;
    expenseNumber: string;
    expenseDate: Date,
    dueDate: Date,
    amount: number;
    payThrough: string,
    notes: string | null;
    isSyncWithPaymentsSection?: boolean
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

         projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
        },
        vendorName: { type: String, default: null },
        dueDate: {type:Date, default:null},
        expenseNumber: { type: String, },
        expenseDate: { type: Date, default: new Date() },
        amount: { type: Number, default: 0 },
        notes: { type: String, default: null },
        payThrough: { type: String, default: null },
        isSyncWithPaymentsSection: {type: Boolean, default:false}
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
ExpenseSchema.pre("save", async function (next) {
  if (this.isNew && !this.expenseNumber) {
        const currentYear = new Date().getFullYear();


    const lastDoc = await mongoose
      .model("ExpenseAccountModel")
      .findOne({organizationId: this.organizationId}, { expenseNumber: 1 })
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastDoc && lastDoc.expenseNumber) {
      const match = lastDoc.expenseNumber.match(new RegExp(`EXP-${currentYear}-(\\d+)$`));
      if (match) nextNumber = parseInt(match[1]) + 1;
    }

    this.expenseNumber = `EXP-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});

export const ExpenseAccountModel = mongoose.model<IExpenseAccount>("ExpenseAccountModel", ExpenseSchema);
