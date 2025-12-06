import mongoose, { Schema, Document } from "mongoose";

export interface IVendorPayment {
    organizationId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId | null;
    vendorName: string;
    paymentNumber: string,
    vendorPaymentDate: Date,
    paymentMode: string,
    paidThrough: string,
    paymentTerms: string,

    items: IVendorPaymentItems[]
    totalAmount: number

    isSyncWithPaymentsSection?: boolean
    notes: string
}

export interface IVendorPaymentItems {
    itemName: string;
    billAmount: number;
}

const VendorPaymentItemSchema = new Schema<IVendorPaymentItems>({
    itemName: { type: String, default: null },
    billAmount: { type: Number, default: 0, },

});

const VendorPaymentSchema = new Schema<IVendorPayment>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel", default: null,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
            default: null,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "VendorAccountModel", default: null,
        },
        vendorName: { type: String, default: null, },
        paymentNumber: { type: String, default: null, },
        vendorPaymentDate: { type: Date, default: null, },
        paymentMode: { type: String, default: null, },
        paymentTerms: { type: String, default: null, },
        paidThrough: { type: String, default: null, },
        items: { type: [VendorPaymentItemSchema], default: [] },
        totalAmount: { type: Number, default: 0, },
        isSyncWithPaymentsSection: {
            type: Boolean,
            default: false
        },
        notes: { type: String, default: null, },
    },
    { timestamps: true }
);



// ✅ Pre-save hook to auto-generate unique invoice number
VendorPaymentSchema.pre("save", async function (next) {
    if (this.isNew && !this.paymentNumber) {
        const year = new Date().getFullYear();
        const lastDoc = await mongoose
            .model("VendorPaymentModel")
            .findOne({ organizationId: this.organizationId }, { paymentNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc?.paymentNumber) {
            const match = lastDoc.paymentNumber.match(/\d+$/);
            if (match && match[1]) {
                nextNumber = Number(match[1]) + 1;
            }
        }

        this.paymentNumber = `VEN-PAY-${year}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

export const VendorPaymentAccountModel = mongoose.model<IVendorPayment>("VendorPaymentModel", VendorPaymentSchema);