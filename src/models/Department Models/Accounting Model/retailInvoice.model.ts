import mongoose, { Schema, Document } from "mongoose";

export interface IRetailInvoiceItem {
  itemName: string;
  quantity: number;
  rate: number;
  totalCost: number; // quantity * rate
}

export interface IRetailInvoice extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  mobile?: string;
  salesPerson?: string;
  invoiceNumber: string;
  items: IRetailInvoiceItem[];
  totalAmount: number;


    discountPercentage?: number;
  discountAmount?: number;

  taxPercentage?: number;
  taxAmount?: number;

  grandTotal: number;
}

const RetailInvoiceItemSchema = new Schema<IRetailInvoiceItem>(
  {
    itemName: { type: String,  },
    quantity: { type: Number,  default: 1 },
    rate: { type: Number,  },
    totalCost: { type: Number,  }, // quantity * rate
  },
  { _id: false }
);

const RetailInvoiceSchema = new Schema<IRetailInvoice>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccountModel",
      
    },
    customerName: { type: String,  default:null },
    mobile: { type: String ,default:null },
    salesPerson: { type: String , default:null },
    invoiceNumber: { type: String, default:null },
    items: { type: [RetailInvoiceItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },


      discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    taxPercentage: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    grandTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// // ✅ Automatically calculate subtotal before saving
// RetailInvoiceSchema.pre("save", function (next) {
//   this.subTotal = this.items.reduce(
//     (sum, item) => sum + item.quantity * item.rate,
//     0
//   );
//   next();
// });

export const RetailInvoiceAccountModel = mongoose.model<IRetailInvoice>(
  "RetailInvoiceAccountModel",
  RetailInvoiceSchema
);
