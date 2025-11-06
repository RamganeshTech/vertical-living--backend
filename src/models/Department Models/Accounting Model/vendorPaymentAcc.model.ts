import mongoose, { Schema, Document } from "mongoose";

export interface IVendorPayment {
    organizationId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    vendorName: string;
    paymentNumber: string,
    paymentDate: Date,
    paymentMode: string,
    paidThrough: string,

    items: IVendorPaymentItems[]
    totalAmount: number
    totalDueAmount: number
    notes: string
}

export interface IVendorPaymentItems {
    date: Date; // The date of the bill or transaction
    // bill: mongoose.Types.ObjectId; // Reference to the bill document
    billAmount: number; // Total bill amount
    amountDue: number; // Remaining due amount before payment
    paymentMadeOn: Date; // Actual date when payment was made
    // payment: number; // Amount paid for this particular bill
}

const VendorPaymentItemSchema = new Schema<IVendorPaymentItems>({
    date: { type: Date, default: new Date() },
    // bill: { type: Schema.Types.ObjectId, ref: "BillModel", },
    billAmount: { type: Number, default: 0, },
    amountDue: { type: Number, default: 0, },
    paymentMadeOn: { type: Date, default: null },
    // payment: { type: Number, default: 0, },
});

const VendorPaymentSchema = new Schema<IVendorPayment>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel", default: null,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "VendorAccountModel", default: null,
        },
        vendorName: { type: String, default: null, },
        paymentNumber: { type: String, default: null, },
        paymentDate: { type: Date, default: null, },
        paymentMode: { type: String, default: null, },
        paidThrough: { type: String, default: null, },
        items: { type: [VendorPaymentItemSchema], default: []},
        totalAmount: { type: Number, default: 0, },
        totalDueAmount: { type: Number, default: 0, },
        notes: { type: String, default: null, },
    },
    { timestamps: true }
);



// ✅ Pre-save hook to auto-generate unique invoice number
VendorPaymentSchema.pre("save", async function (next) {
    if (this.isNew && !this.paymentNumber) {
        const lastDoc = await mongoose
            .model("VendorPaymentModel")
            .findOne({}, { paymentNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.paymentNumber) {
            const match = lastDoc.paymentNumber.match(/\d+$/);
            if (match) nextNumber = parseInt(match[0]) + 1;
        }

        this.paymentNumber = `VEN-PAY-${String(nextNumber).padStart(4, "0")}`;
    }
    next();
});

export const VendorPaymentAccountModel = mongoose.model<IVendorPayment>("VendorPaymentModel", VendorPaymentSchema);