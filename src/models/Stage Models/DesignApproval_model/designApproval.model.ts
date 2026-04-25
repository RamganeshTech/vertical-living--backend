import mongoose, { Schema, Document, Types } from "mongoose";
// 1. Clean File Item (Staff Uploads Only)
export interface IFileItem {
    _id?: Types.ObjectId;
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

const fileSchema = new Schema<IFileItem>({
    type: { type: String, enum: ["image", "pdf"], required: true },
    url: { type: String, required: true },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() },
}, { _id: true });

// 2. Client Feedback Item (Client Responses Only)
export interface IFileFeedback {
    fileId: Types.ObjectId;      // Maps to the IFileItem _id
    comment: string;
    isSelected: boolean;         // True if the client picked this specific design
}

const fileFeedbackSchema = new Schema<IFileFeedback>({
    fileId: { type: Schema.Types.ObjectId, },
    comment: { type: String, default: "" },
    isSelected: { type: Boolean, default: false }
}, { _id: true });

// 3. Phase Schema
export interface IPhase {
    _id?: Types.ObjectId;
    phaseNumber: number;
    files: IFileItem[];
    feedbacks: IFileFeedback[];  // <-- NEW: Array of objects storing comments by fileId
    status: "Pending" | "Approved" | "Revision_Requested";
    clientOverallComment?: string;
    reviewedAt?: Date;
}

const phaseSchema = new Schema<IPhase>({
    phaseNumber: { type: Number, required: true },
    files: [fileSchema],
    feedbacks: [fileFeedbackSchema], // <-- ADDED HERE
    status: { type: String, default: "Pending" },
    clientOverallComment: { type: String, default: "" },
    reviewedAt: { type: Date }
}, { _id: true, timestamps: true });

// 3. Main Design Approval Schema (Handles 2D/3D for a Project)
export interface IDesignApproval extends Document {
    projectId: Types.ObjectId;
    designType: "2D" | "3D";
    design2D: {
        phases: IPhase[];
    }
    design3D: {
        phases: IPhase[];
    }
    isFullyApproved: boolean;

    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadLine: Date | null;
        reminderSent: boolean
    };
    assignedTo: Types.ObjectId;
  status: "pending" | "completed";

}

const designApprovalSchema = new Schema<IDesignApproval>({
    //   projectId: { type: Schema.Types.ObjectId, ref: "ProjectModal", required: true },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "ProjectModel",
        required: true,
    },
    timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "StaffModel"
    },

    design2D: {
        phases: [phaseSchema],
    },

    design3D: {
        phases: [phaseSchema],
    },

    // status: { type: String, default: "pending" }
  status: { type: String, enum: ["pending", "completed"], default: "pending" },


        isFullyApproved: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure we only have one 2D and one 3D document per project
designApprovalSchema.index({ projectId: 1, });

export const DesignApprovalModel = mongoose.model<IDesignApproval>("DesignApprovalModel", designApprovalSchema);