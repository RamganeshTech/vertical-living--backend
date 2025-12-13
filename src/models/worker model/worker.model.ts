// models/Worker.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { DepartmentPermission } from "../staff model/staff.model";

export interface IWorker extends Document {
    workerName: string;
    email: string;
    phoneNo?: string;
    password: string;
    role: string;
    // specificRole: string[];
    permission: {
        [department: string]: DepartmentPermission;
    };
    isGuideRequired:boolean,
    ownerId: Types.ObjectId;
    projectId: Types.ObjectId[];
    organizationId: Types.ObjectId[];
    invitedBy: Types.ObjectId;
    invitedByModel: string;
    isRegistered: boolean;
    resetPasswordToken?: string;
    resetPasswordExpire?: number;
}

const workerSchema = new Schema<IWorker>({
    workerName: { type: String },
    email: { type: String, required: true },
    phoneNo: { type: String },
    password: { type: String, required: true },
    role: { type: String, required: true },
    // specificRole: { type: [String],  default:[]},
    permission: {
        type: Object,
        default: {}
    },
    isGuideRequired: { type: Boolean, default: true },

    projectId: { type: [Schema.Types.ObjectId], ref: "ProjectModel", default: [] },
    organizationId: { type: [Schema.Types.ObjectId], ref: "OrganizationModel", required: true, default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
    invitedBy: {
        type: Schema.Types.ObjectId,
        // required: true,
        refPath: "invitedByModel",
        default: null
    },
    invitedByModel: {
        type: String,
        // required: true,
        enum: ["UserModel", "StaffModel", "CTOModel", null],
        default: null
    },
    isRegistered: { type: Boolean, default: false },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
});



workerSchema.index({ email: 1 }, { unique: true, sparse: true });
workerSchema.index({ phoneNo: 1 }, { unique: true, sparse: true });


export const WorkerModel = mongoose.model<IWorker>("WorkerModel", workerSchema);
