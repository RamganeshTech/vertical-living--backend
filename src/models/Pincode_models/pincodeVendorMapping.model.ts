import { model,Schema,Types } from "mongoose";

export interface IVendorPincodeMapping extends Document {
    organizationId: Types.ObjectId;
    vendorId: Types.ObjectId;
    pincodeId: Types.ObjectId;
    vendorRole: "Primary" | "Secondary" | "Backup";
    serviceMode: "Direct" | "Hybrid" | "Partner";
    priorityRank: number;
    minOrderValue: number;
    maxProjectValue: number;
    rateMultiplier: number;
    travelRule: string;
    serviceVisitRule: string;
    siteVisitSlaDays: number;
    installSlaDays: number;
    complaintSlaHours: number;
    premiumJobAllowed: boolean;
    repairJobAllowed: boolean;
    activeStatus: boolean;
    notes: string | null;
}

const VendorPincodeMappingSchema = new Schema<IVendorPincodeMapping>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
        vendorId: { type: Schema.Types.ObjectId, ref: "VendorAccountModel", required: true }, // [cite: 287]
        
        pincodeId: { type: Schema.Types.ObjectId, ref: "PincodeMasterModel", required: true }, // [cite: 286]
        
        vendorRole: { type: String, enum: ["Primary", "Secondary", "Backup"], default: "Primary" }, // [cite: 289]
        serviceMode: { type: String, enum: ["Direct", "Hybrid", "Partner"], default: "Direct" }, // [cite: 288]
        priorityRank: { type: Number, default: 1 },

        minOrderValue: { type: Number, default: 0 }, // [cite: 298]
        maxProjectValue: { type: Number, default: 0 }, // [cite: 299]
        rateMultiplier: { type: Number, default: 1.0 }, // [cite: 296]
        travelRule: { type: String, default: null }, // [cite: 297]
        serviceVisitRule: { type: String, default: null },

        // SLA Fields [cite: 293-295]
        siteVisitSlaDays: { type: Number, default: 2 },
        installSlaDays: { type: Number, default: 15 },
        complaintSlaHours: { type: Number, default: 48 },

        premiumJobAllowed: { type: Boolean, default: false }, // [cite: 300]
        repairJobAllowed: { type: Boolean, default: true }, // [cite: 306]
        activeStatus: { type: Boolean, default: true }, // [cite: 307]
        notes: { type: String, default: null } // [cite: 308]
    },
    { timestamps: true }
);

const PincodeVendorMappingModel = model<IVendorPincodeMapping>("PincodeVendorMappingModel", VendorPincodeMappingSchema);

export default PincodeVendorMappingModel