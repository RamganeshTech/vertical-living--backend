import mongoose, { Schema, Types } from "mongoose";


export interface IAccounting extends Document {
  transactionNumber?: string | null;
  organizationId: Types.ObjectId;
  projectId: Types.ObjectId;
  subContractId: Types.ObjectId;
  transactionType: "quote" | "invoice" | "payment" | "expense" | "refund";
  fromDept?: "logistics" | "hr" | "procurement" | "factory" | null;
  totalAmount: {
    amount: number;
    taxAmount: number;
  };
  upiId: string | null,
  status: "approved" | "paid" | "cancelled" | "overdue" | "pending";
  dueDate: Date | null;
  notes: string;
  // approvedAt?: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const accountingSchema = new Schema<IAccounting>({
  transactionNumber: {
    type: String,
    default: null
  },
  subContractId: { type: Schema.Types.ObjectId, ref: "SubContractModel", default:null },
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel'
  },
  transactionType: {
    type: String,
    enum: ['quote', 'invoice', 'payment', 'expense', 'refund', null],
    default: "payment"
  },
  fromDept: { type: String, enum: ["logistics", "hr", "procurement", "factory", null], default: null },
  upiId: { type: String, default: null },
  totalAmount: {
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0
    },
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['paid', 'cancelled', "pending"]
  },
  dueDate: { type: Date, default: null },
  notes: { type: String, default: null },
  // createdBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'UserModel',
  // },
  // approvedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'UserModel'
  // },
  // approvedAt: {type: Date, default: null},
  paidAt: { type: Date, default: null }
}, {
  timestamps: true
});



// accountingSchema.pre<IAccounting>("save", async function (next) {
//   if (!this.transactionNumber) {
//     // Example: ACC-20250906-001
//     const prefix = "ACC";
//     const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

//     // Find how many transactions already exist for today
//     const count = await AccountingModel.countDocuments({
//       createdAt: {
//         $gte: new Date(new Date().setHours(0, 0, 0, 0)),
//         $lt: new Date(new Date().setHours(23, 59, 59, 999)),
//       },
//     });

//     this.transactionNumber = `${prefix}-${dateStr}-${(count + 1)
//       .toString()
//       .padStart(3, "0")}`;
//   }

//   next();
// });



export const AccountingModel = mongoose.model<IAccounting>(
  "AccountingModel",
  accountingSchema
);
