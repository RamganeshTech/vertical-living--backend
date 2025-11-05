import mongoose, { Schema, Document, Types } from "mongoose";


export interface IBillAccount extends Document {
    organizationId: mongoose.Types.ObjectId;
    vendorId: Types.ObjectId;
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


    notes: string | null;
}


export interface IBillItem {
    itemName: string;
    quantity: number;
    rate: number;
    totalCost: number; // quantity * rate
}

const InvoiceItemSchema = new Schema<IBillItem>(
    {
        itemName: { type: String, },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, },
        totalCost: { type: Number, }, // quantity * rate
    },
    { _id: true }
);



const BillAccountSchema = new Schema<IBillAccount>(
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
        billNumber: { type: String, },
        billDate: { type: Date, default: new Date() },
        dueDate: { type: Date, default: new Date() },
        accountsPayable: { type: String, default: null },
        subject: { type: String, default: null },
        items: { type: [InvoiceItemSchema], default: [] },
        totalAmount: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        notes: { type: String, default: null },
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
BillAccountSchema.pre("save", async function (next) {
    if (this.isNew && !this.billNumber) {
        const lastDoc = await mongoose
            .model("BillAccountModel")
            .findOne({}, { billNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.billNumber) {
            const match = lastDoc.billNumber.match(/\d+$/);
            if (match) nextNumber = parseInt(match[0]) + 1;
        }

        this.billNumber = `BILL-${String(nextNumber).padStart(4, "0")}`;
    }
    next();
});

export const BillAccountModel = mongoose.model<IBillAccount>("BillAccountModel", BillAccountSchema);
