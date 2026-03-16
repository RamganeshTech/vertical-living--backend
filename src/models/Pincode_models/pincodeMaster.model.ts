import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPincodeMaster extends Document {
    organizationId: Types.ObjectId;
    pincode: string;
    areaName: string;
    localityName: string;
    taluk: string;
    district: string;
    zone: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    urbanClassification: "Urban" | "Semi-Urban" | "Rural";
    activeStatus: boolean;

    // Business Fields
    serviceStatus: "Active" | "Restricted" | "Blocked" | "Approval Required";
    serviceMode: "Direct Core" | "Direct Extended" | "Hybrid" | "Partner Managed";
    approvalRequired: boolean;
    minOrderValue: number;
    directMarginPercent: number;
    partnerMarginPercent: number;

    // Factors
    transportFactor: number;
    installFactor: number;
    serviceFactor: number;
    complexityFactor: number;

    riskLevel: "Low" | "Medium" | "High";
    notes: string | null;
    lastReviewedAt: Date | null;
    reviewedBy: Types.ObjectId | null;
    partners: {partnerId: Types.ObjectId}[];
}

const PincodeMasterSchema = new Schema<IPincodeMaster>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
        pincode: { type: String, required: true }, // [cite: 79]
        areaName: { type: String, default: null }, // [cite: 80]
        localityName: { type: String, default: null }, // [cite: 81]
        taluk: { type: String, default: null }, // [cite: 82]
        district: { type: String,  default: null }, // [cite: 83]
        zone: { type: String,default: null }, // [cite: 84]
        state: { type: String, default: "Tamil Nadu" }, // [cite: 85]
        latitude: { type: Number, default: null }, // [cite: 88]
        longitude: { type: Number, default: null }, // [cite: 89]
        urbanClassification: { type: String, enum: ["Urban", "Semi-Urban", "Rural"], default: "Urban" }, // [cite: 87]
        activeStatus: { type: Boolean, default: true },

        // Business Logic Fields
        serviceStatus: { 
            type: String, 
            enum: ["Active", "Restricted", "Blocked", "Approval Required"], 
            default: "Active" 
        }, // [cite: 95]
        serviceMode: { 
            type: String, 
            enum: ["Direct Core", "Direct Extended", "Hybrid", "Partner Managed"], 
            default: "Direct Core" 
        }, // [cite: 96]
        approvalRequired: { type: Boolean, default: false }, // [cite: 131]
        minOrderValue: { type: Number, default: 0 }, // [cite: 124]
        directMarginPercent: { type: Number, default: 0 }, // [cite: 122]
        partnerMarginPercent: { type: Number, default: 0 }, // [cite: 123]

        transportFactor: { type: Number, default: 1.0 }, // [cite: 126]
        installFactor: { type: Number, default: 1.0 }, // [cite: 127]
        serviceFactor: { type: Number, default: 1.0 }, // [cite: 128]
        complexityFactor: { type: Number, default: 1.0 }, // [cite: 129]

        riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" }, // [cite: 136]
        notes: { type: String, default: null }, // [cite: 138]
        lastReviewedAt: { type: Date, default: null }, // [cite: 139]
        reviewedBy: { type: Schema.Types.ObjectId, ref: "StaffModel", default: null }, // [cite: 140]

        partners: [{
            partnerId: { type: Schema.Types.ObjectId, ref: "ExecutionPartnerModel" },
        }],
    },
    { timestamps: true }
);

const PincodeMasterModel = mongoose.model<IPincodeMaster>("PincodeMasterModel", PincodeMasterSchema);

export default PincodeMasterModel