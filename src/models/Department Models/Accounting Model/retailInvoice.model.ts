import mongoose, { Schema, Document } from "mongoose";
import { IUploadPdf } from "./invoiceAccount.model";

export interface IRetailInvoiceItem {
  itemName: string;
  quantity: number;
  rate: number;
  unit?: string;
  totalCost: number; // quantity * rate
}

export interface IRetailInvoice extends Document {
  customerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  customerName: string;
  mobile?: string;
  salesPerson?: string;
  projectId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  subject?: string;
  invoiceDate: Date ;
  items: IRetailInvoiceItem[];
  totalAmount: number;


  discountPercentage?: number;
  discountAmount?: number;

  taxPercentage?: number;
  taxAmount?: number;

  grandTotal: number;
  paymentMode: "cash" | "card" | "cheque" | "bank transfer" | "UPI" | null

  pdfData?: IUploadPdf
  customerNotes?: string

}



const pdfGeneratorSchema = new Schema<IUploadPdf>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const RetailInvoiceItemSchema = new Schema<IRetailInvoiceItem>(
  {
    itemName: { type: String, },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, },
    unit: { type: String, default: "" },
    totalCost: { type: Number, }, // quantity * rate
  },
  { _id: true }
);

const RetailInvoiceSchema = new Schema<IRetailInvoice>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "CustomerAccountModel",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "OrganizationModel"
    },
    customerName: { type: String, default: null },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectModel",
    },
    mobile: { type: String, default: null },
    salesPerson: { type: String, default: null },
    subject: { type: String, default: null },
    invoiceDate: { type: Date, default: new Date() },
    invoiceNumber: { type: String, default: null },
    items: { type: [RetailInvoiceItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },

    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    taxPercentage: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    grandTotal: { type: Number, default: 0 },
    paymentMode: { type: String, default: null, enum: ["cash", "card", "cheque", "bank transfer", "UPI", null] },
    customerNotes: { type: String, default: null },
    pdfData: { type: pdfGeneratorSchema, default: null }
  },
  { timestamps: true }
);


export const RetailInvoiceAccountModel = mongoose.model<IRetailInvoice>(
  "RetailInvoiceAccountModel",
  RetailInvoiceSchema
);
