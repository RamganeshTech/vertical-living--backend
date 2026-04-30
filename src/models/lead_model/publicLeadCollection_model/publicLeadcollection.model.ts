import mongoose, { Schema, Document } from "mongoose";

export interface IPublicLead extends Document {
    organizationId: string;
    leadNumber: string;
    fullName: string;
    mobileNumber: string;
    projectCategory: string;
    propertyType: string;
    budget: string;
    location: string;
    timeline: string;
    serviceType: string;
    createdAt: Date;
}

const PublicLeadSchema: Schema = new Schema(
    {
        organizationId: { type: String, required: true, index: true },
        leadNumber: { type: String,  },
        fullName: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        projectCategory: { type: String },
        propertyType: { type: String },
        budget: { type: String },
        location: { type: String },
        timeline: { type: String },
        serviceType: { type: String },
    },
    { timestamps: true }
);

// ✅ Pre-save hook to auto-generate unique lead number (e.g., VL-LEAD-2026-001)
PublicLeadSchema.pre<IPublicLead>("save", async function (next) {
    if (this.isNew && !this.leadNumber) {
        const currentYear = new Date().getFullYear();

        const lastDoc = await mongoose
            .model("PublicLeadCollectionModel")
            .findOne({ organizationId: this.organizationId }, { leadNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.leadNumber) {
            const match = lastDoc.leadNumber.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        // Using LEAD prefix to distinguish from Quote numbers
        this.leadNumber = `VL-LEAD-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});


const PublicLeadCollectionModel = mongoose.model<IPublicLead>("PublicLeadCollectionModel", PublicLeadSchema);

export default PublicLeadCollectionModel;