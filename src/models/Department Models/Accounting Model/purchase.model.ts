import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseItem {
    itemName: string;
    quantity: number;
    rate: number;
    totalCost: number; // quantity * rate
}

export interface IPurchaseAccMain extends Document {
    vendorId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    vendorName: string;
    deliveryAddress: string
    purchaseOrderNumber: string,
    purchaseDate: Date;
    deliveryDate: Date;

    items: IPurchaseItem[];
    totalAmount: number;

    discountPercentage?: number;
    discountAmount?: number;

    taxPercentage?: number;
    taxAmount?: number;

    grandTotal: number;

    notes?: string;
    termsAndConditions?: string;
}

const PurchaseItemScheam = new Schema<IPurchaseItem>(
    {
        itemName: { type: String, },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, },
        totalCost: { type: Number, }, // quantity * rate
    },
    { _id: true }
);

const PurchaseAccSchema = new Schema<IPurchaseAccMain>(
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

        deliveryAddress: { type: String, default: null },
        purchaseOrderNumber: { type: String, default: null },
        purchaseDate: { type: Date, default: new Date() },
        deliveryDate: { type: Date, default: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },

        items: { type: [PurchaseItemScheam], default: [] },
        totalAmount: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        notes: { type: String, default: null },
        termsAndConditions: { type: String, default: null },
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
PurchaseAccSchema.pre("save", async function (next) {
    if (this.isNew && !this.purchaseOrderNumber) {
        const lastDoc = await mongoose
            .model("PurchaseAccountModel")
            .findOne({}, { purchaseOrderNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.purchaseOrderNumber) {
            const match = lastDoc.purchaseOrderNumber.match(/\d+$/);
            if (match) nextNumber = parseInt(match[0]) + 1;
        }

        this.purchaseOrderNumber = `PUR-${String(nextNumber).padStart(4, "0")}`;
    }
    next();
});


export const PurchaseAccountModel = mongoose.model<IPurchaseAccMain>("PurchaseAccountModel", PurchaseAccSchema);
