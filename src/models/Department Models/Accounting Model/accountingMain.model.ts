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
  items: IAccountsItems[]
  // approvedAt?: Date;
  paidAt: Date | null;
  installMents?: IInstallmentAcc[]
  createdAt: Date;
  updatedAt: Date;
}


export interface IInstallmentAcc {
  amount: number
  dueDate: Date,
  status: string,  // or "paid"
  orderId: string,        // Razorpay order ID
  paymentId: string,
  transactionId: string
  paidAt: Date | null
  failureReason: string | null
  fees: number | null
  tax: number | null
}


export interface IAccountsItems extends Omit<IInstallmentAcc, "amount"> {
  itemName: string;
  quantity: number;
  rate: number;
  unit: string;
  totalCost: number; // quantity * rate
}

const InstallmentAccSchema = new Schema<IInstallmentAcc>({
  amount: { type: Number, default: null },
  dueDate: { type: Date, default: null },
  status: { type: String, default: null },
  orderId: { type: String, default: null }, // Razorpay order/fund_account_id
  paymentId: { type: String, default: null }, // Razorpay payout_id
  transactionId: { type: String, default: null }, // UTR number
  paidAt: { type: Date, default: null },
  failureReason: { type: String, default: null },
  fees: { type: Number, default: null },
  tax: { type: Number, default: null }
}, { _id: true })




const AccountItemsSchema = new Schema<IAccountsItems>({
  itemName: { type: String, },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, },
  unit: { type: String, default: "" },
  totalCost: { type: Number, }, // quantity * rate
  dueDate: { type: Date, default: null },
  status: { type: String, default: null },
  orderId: { type: String, default: null }, // Razorpay order/fund_account_id
  paymentId: { type: String, default: null }, // Razorpay payout_id
  transactionId: { type: String, default: null }, // UTR number
  paidAt: { type: Date, default: null },
  failureReason: { type: String, default: null },
  fees: { type: Number, default: null },
  tax: { type: Number, default: null }
},
  { _id: true })

const accountingSchema = new Schema<IAccounting>({
  transactionNumber: {
    type: String,
    default: null
  },
  subContractId: { type: Schema.Types.ObjectId, ref: "SubContractModel", default: null },
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", default: null },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'ProjectModel'
  },
  transactionType: {
    type: String,
    enum: ['quote', 'invoice', 'payment', 'expense', 'refund', null],
    default: "payment"
  },
  fromDept: { type: String, enum: ["logistics", "hr", "procurement", "factory", null], default: null },
  upiId: { type: String, default: null },
  items: { type: [AccountItemsSchema], default: null },
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
  paidAt: { type: Date, default: null },
  installMents: { type: [InstallmentAccSchema], default: [] },
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
