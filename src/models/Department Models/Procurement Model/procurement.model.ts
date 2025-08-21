import mongoose, { Schema } from "mongoose";



const ActiveLog = new Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectModel",
        default: null
    },
    // Polymorphic user reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "userType"
    },
    userType: {
        type: String,
        enum: ["UserModel", "StaffModel", "WorkerModel", "ClientModel", "CTOModel"]
    },
    // Polymorphic stage reference
    stageId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        refPath: "stageModel"
    },
    stageModel: {
        type: String,
        default: null,
        // Keep enum if you want to restrict to the 14 stage models you have
        // enum: ["StageTypeA", "StageTypeB", ...]
    },
    userRole: {
        type: String,
        default: null
    },
    actionType: {
        type: String, // e.g. "create", "update", "delete", "upload", "assign"
    },
    // entityType: {
    //     type: String, // free-form: "project", "stageImage", "payment", "milestone", etc.
    // },
    description: {
        type: String,
        default: ""
    },
    newData: {
        type: mongoose.Schema.Types.Mixed, // store any new data (flexible JSON)
        default: {}
    }
})

const ProcurementSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationModel",
        },
        activeLog: { type: [ActiveLog], default: [] }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

// Indexes for fast querying
ProcurementSchema.index({ organizationId: 1, createdAt: -1 });
ProcurementSchema.index({ projectId: 1, createdAt: -1 });
// ProcurementSchema.index({ stageId: 1, createdAt: -1 });

export default mongoose.model("ProcurementModel", ProcurementSchema);
