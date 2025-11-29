import mongoose, { Schema, Document } from "mongoose";






export interface IUploadPdf {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}

export interface IInvoiceItem {
  itemName: string;
  quantity: number;
  rate: number;
  unit?: string;
  totalCost: number; // quantity * rate
}

export interface IInvoice extends Document {
  customerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
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

  pdfData?: IUploadPdf
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    itemName: { type: String, },
    quantity: { type: Number, default: 0 },
    rate: { type: Number, },
    unit: { type: String, default: ""},
    totalCost: { type: Number, }, // quantity * rate
  },
  { _id: true }
);





const pdfGeneratorSchema = new Schema<IUploadPdf>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const InvoiceSchema = new Schema<IInvoice>(
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
    invoiceNumber: { type: String, default: null },
    orderNumber: { type: String, default: null },
    accountsReceivable: { type: String, default: null },
    salesPerson: { type: String, default: null },
    subject: { type: String, default: null },
    invoiceDate: { type: Date, default: new Date() },
    terms: { type: String, default: null },
    dueDate: { type: Date, default: null },

    items: { type: [InvoiceItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    customerNotes: { type: String, default: null },
    termsAndConditions: { type: String, default: null },
    pdfData: { type: pdfGeneratorSchema, default: null }
  },
  { timestamps: true }
);

export const InvoiceAccountModel = mongoose.model<IInvoice>("InvoiceAccountModel", InvoiceSchema);