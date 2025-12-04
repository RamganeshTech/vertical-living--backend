import mongoose, { Schema, Document, Types } from "mongoose";
import { IUploadPdf } from "./invoiceAccount.model";


export interface IBillAccount extends Document {
    organizationId: mongoose.Types.ObjectId;
    vendorId: Types.ObjectId;
    projectId: Types.ObjectId;
    accountingRef: Types.ObjectId;
    vendorName: string;
    billNumber: string,
    billDate: Date,
    dueDate: Date,
    subject: string,
    accountsPayable: string
    items: IBillItem[],

    totalAmount: number;

    discountPercentage?: number;
    discountAmount?: number;

    taxPercentage?: number;
    taxAmount?: number;

    grandTotal: number;

    advancedAmount: number
    paymentType: string

    notes: string | null;
    images: IBillUploads[],
    pdfData: IBillUploads | null,
    isSyncedWithAccounting?: boolean
    isSyncWithPaymentsSection?: boolean
}


export interface IBillItem {
    itemName: string;
    quantity: number;
    rate: number;
    unit: string;
    totalCost: number; // quantity * rate
}

const BillItemSchema = new Schema<IBillItem>(
    {
        itemName: { type: String, },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, },
        unit: { type: String, default: "" },
        totalCost: { type: Number, }, // quantity * rate
    },
    { _id: true }
);


export interface IBillUploads extends IUploadPdf { }





const BillUploadSchema = new Schema<IUploadPdf>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


const BillAccountSchema = new Schema<IBillAccount>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel"
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "VendorAccountModel",
            default: null
        },

        accountingRef: {
            type: Schema.Types.ObjectId,
            ref: "AccountingModel",
            default: null
        },

        projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
            default: null
        },
        vendorName: { type: String, default: null },
        billNumber: { type: String, },
        billDate: { type: Date, default: new Date() },
        dueDate: { type: Date, default: new Date() },
        accountsPayable: { type: String, default: null },
        subject: { type: String, default: null },
        items: { type: [BillItemSchema], default: [] },
        totalAmount: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        notes: { type: String, default: null },
        images: { type: [BillUploadSchema], default: [] },
        pdfData: { type: BillUploadSchema, default: null },

        advancedAmount: { type: Number, default: 0 },
        paymentType: { type: String, default: "" },

        isSyncedWithAccounting: {
            type: Boolean,
            default: false
        },
        isSyncWithPaymentsSection: {
            type: Boolean,
            default: false
        }

    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
BillAccountSchema.pre("save", async function (next) {
    if (this.isNew && !this.billNumber) {
          const currentYear = new Date().getFullYear();
          
        const lastDoc = await mongoose
            .model("BillAccountModel")
            .findOne({organizationId: this.organizationId}, { billNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.billNumber) {
            const match = lastDoc.billNumber.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        this.billNumber = `Bill-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

export const BillAccountModel = mongoose.model<IBillAccount>("BillAccountModel", BillAccountSchema);
