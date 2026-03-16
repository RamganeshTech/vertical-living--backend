import mongoose, {Schema, Types} from "mongoose"

export interface IProjectAssignment extends Document {
    projectId: Types.ObjectId;
    partnerId: Types.ObjectId;
    organizationId: Types.ObjectId;
    
    // Legal & Acknowledgement
    termsAndConditions: string; // The text generated at the time of assignment
    status: "pending" | "accepted" | "rejected" | "in-progress" | "completed";
    
    // Acknowledgement Data (The "E-Signature")
    acknowledgedAt: Date | null;
    acknowledgeStatus:string
    ipAddress: string | null; // For legal proof
    notes?: string;
}

const ProjectAssignmentSchema = new Schema<IProjectAssignment>({
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "ExecutionPartnerModel",},
    
    termsAndConditions: { type: String,  },
    status: { 
        type: String, 
        enum: ["pending", "accepted", "rejected", "in-progress", "completed"], 
        default: "pending" 
    },
    
    acknowledgedAt: { type: Date, default: null },
    acknowledgeStatus: { type: String, enum:["pending", "accepted"], default: "pending" },
    ipAddress: { type: String, default: null },
    notes: String
}, { timestamps: true });

export const PincodeVendorProjectAssignment = mongoose.model<IProjectAssignment>("PincodeVendorProjectAssignmentModel", ProjectAssignmentSchema);