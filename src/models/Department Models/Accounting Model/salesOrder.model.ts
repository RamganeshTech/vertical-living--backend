import mongoose, { Schema, Document } from "mongoose";

export interface ISalesItem {
    itemName: string;
    quantity: number;
    rate: number;
    totalCost: number; // quantity * rate
}

export interface ISalesMain extends Document {
    customerId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    customerName: string;
    salesOrderDate: Date,
    expectedShipmentDate: Date;
    salesPerson?: string;
    subject?: string;
   
    items: ISalesItem[];
    totalAmount: number;

    discountPercentage?: number;
    discountAmount?: number;

    taxPercentage?: number;
    taxAmount?: number;

    grandTotal: number;

    customerNotes?: string;
    termsAndConditions?: string;
}

const SalesItemScheam = new Schema<ISalesItem>(
    {
        itemName: { type: String, },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, },
        totalCost: { type: Number, }, // quantity * rate
    },
    { _id: true }
);

const SalesAccSchema = new Schema<ISalesMain>(
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
        salesOrderDate: { type: Date, default: new Date() },
        expectedShipmentDate: { type: Date, default: new Date() },
        salesPerson: { type: String, default: null },
        subject: { type: String, default: null },


        items: { type: [SalesItemScheam], default: [] },
        totalAmount: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        customerNotes: { type: String, default: null },
        termsAndConditions: { type: String, default: null },
    },
    { timestamps: true }
);

export const SalesAccountModel = mongoose.model<ISalesMain>("SalesAccountModel", SalesAccSchema);
