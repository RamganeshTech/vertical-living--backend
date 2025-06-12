// models/Worker.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorker extends Document {
    workerName?: string;
    email: string;
    phoneNo?: string;
    password: string;
    role: string;
    specificRole: string;
    projectId: Types.ObjectId[];
    organizationId: Types.ObjectId[];
    invitedBy: Types.ObjectId;
    invitedByModel: string;
    isRegistered: boolean;
}

const workerSchema = new Schema<IWorker>({
    workerName: { type: String },
    email: { type: String, required: true, unique: true },
    phoneNo: { type: String },
    password: { type: String, required:true },
    role: { type: String, required: true },
    specificRole: { type: String, required: true },
    projectId: { type: [Schema.Types.ObjectId], ref: "ProjectModel", required: true, default: [] },
    organizationId: { type: [Schema.Types.ObjectId], ref: "OrganizationModel", required: true, default: [] },
    invitedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "invitedByModel"
    },
    invitedByModel: {
        type: String,
        required: true,
        enum: ["UserModel", "StaffModel"]
    },
    isRegistered: { type: Boolean, default: false },
    
}, {
    timestamps:true
});

export const WorkerModel = mongoose.model<IWorker>("WorkerModel", workerSchema);
