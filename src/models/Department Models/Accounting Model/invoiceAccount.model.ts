import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceItem {
  itemName: string;
  quantity: number;
  rate: number;
  totalCost: number; // quantity * rate
}

export interface IInvoice extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  invoiceNumber: string;
  orderNumber?: string;
  accountsReceivable?: string;
  salesPerson?: string;
  subject?: string;
  invoiceDate: Date;
  terms?: string;
  dueDate?: Date;

  items: IInvoiceItem[];
  totalAmount: number;

  discountPercentage?: number;
  discountAmount?: number;

  taxPercentage?: number;
  taxAmount?: number;

  grandTotal: number;

  customerNotes?: string;
  termsAndConditions?: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    itemName: { type: String,  },
    quantity: { type: Number,  default: 0 },
    rate: { type: Number,  },
    totalCost: { type: Number,  }, // quantity * rate
  },
  { _id: true }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccountModel",
    },
    customerName: { type: String, default:null  },
    invoiceNumber: { type: String,  default:null},
    orderNumber: { type: String  ,default:null},
    accountsReceivable: { type: String  ,default:null},
    salesPerson: { type: String  ,default:null},
    subject: { type: String  ,default:null},
    invoiceDate: { type: Date,  default: new Date() },
    terms: { type: String  ,default:null},
    dueDate: { type: Date  ,default:null},

    items: { type: [InvoiceItemSchema], default: [] },

    totalAmount: { type: Number, default: 0 },

    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    taxPercentage: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    grandTotal: { type: Number, default: 0 },

    customerNotes: { type: String, default:null },
    termsAndConditions: { type: String , default:null},
  },
  { timestamps: true }
);

// // ✅ Auto-calculate totals before save
// InvoiceSchema.pre("save", function (next) {
//   // Calculate subtotal
//   const subTotal = this.items.reduce(
//     (sum, item) => sum + item.quantity * item.rate,
//     0
//   );

//   // Apply invoice-level discount
//   const discountAmount = (subTotal * (this.discountPercentage || 0)) / 100;

//   // Apply invoice-level tax
//   const taxableAmount = subTotal - discountAmount;
//   const taxAmount = (taxableAmount * (this.taxPercentage || 0)) / 100;

//   // Calculate grand total
//   const grandTotal = taxableAmount + taxAmount;

//   this.subTotal = subTotal;
//   this.discountAmount = discountAmount;
//   this.taxAmount = taxAmount;
//   this.grandTotal = grandTotal;

//   next();
// });

export const InvoiceAccountModel = mongoose.model<IInvoice>("InvoiceAccountModel", InvoiceSchema);
