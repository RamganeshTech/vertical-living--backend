import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPreSalesQuote extends Document {
    organizationId: Types.ObjectId;
    quoteNo: string;
    mainQuoteName: string;
    clientData?: {
        clientName: string,
        whatsapp: string,
        email: string,
        location: string,
    },
    projectDetails?: {
        projectName: string,
        quoteNo: string,
        dateofIssue: Date
    },
    carpetArea: number;
    bhk: string;
    finishTier: string;
    // Deep configuration object for Rooms > Products > Materials
    config: Record<string, any>;
    totalAmount: number;
    // status: "draft" | "sent" | "approved" | "cancelled";
    status: string
    createdAt: Date;
    updatedAt: Date;
}

const PreSalesQuoteSchema = new Schema<IPreSalesQuote>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
        quoteNo: { type: String, },
        mainQuoteName: { type: String, required: true, },
        clientData: {
            clientName: { type: String, default: null },
            whatsapp: { type: String, default: null },
            email: { type: String, default: null },
            location: { type: String, default: null },
        },
        projectDetails: {
            projectName: { type: String, default: null },
            dateOfIssue: { type: Date, default: null },
        },
        carpetArea: { type: Number, default: 0 },
        bhk: { type: String, default: null },
        finishTier: { type: String, default: null },
        config: { type: Object, default: {} },
        totalAmount: { type: Number, default: 0 },
        status: {
            type: String,
            // enum: ["draft", "sent", "approved", "cancelled"],
            default: "draft",
        },
    },
    { timestamps: true }
);

// ✅ Pre-save hook to auto-generate unique Quote Number per Organization
PreSalesQuoteSchema.pre("save", async function (next) {
    if (this.isNew && !this.quoteNo) {
        const currentYear = new Date().getFullYear();

        const lastDoc = await mongoose
            .model("PreSalesQuoteModel")
            .findOne({ organizationId: this.organizationId }, { quoteNo: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.quoteNo) {
            // This regex extracts the numeric part from the end of the string
            const match = lastDoc.quoteNo.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }
        this.quoteNo = `QT-PRE-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

export const PreSalesQuoteModel = mongoose.model<IPreSalesQuote>(
    "PreSalesQuoteModel",
    PreSalesQuoteSchema
);