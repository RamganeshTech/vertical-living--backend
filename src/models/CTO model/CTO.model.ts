import mongoose, { Schema, Types } from "mongoose"
import { DepartmentPermission } from "../staff model/staff.model";

interface ICTO extends Document {
    email: string,
    password: string,
    CTOName: string,
    phoneNo: string,
    role: string;
    permission: {
        [department: string]: DepartmentPermission;
    };
    organizationId?: [Types.ObjectId];
    projectId?: [Types.ObjectId];
    ownerId: Types.ObjectId | null
    resetPasswordToken?: string;
    resetPasswordExpire?: number;
}


const CTOSchema: Schema<ICTO> = new Schema({
    email: {
        type: String,
        maxLength: [50, "it shoud be within 50 digits"],
        require: true,
    },
    password: {
        type: String,
        require: true,
        maxlength: [100, "password should be under 100 characters"]
    },
    CTOName: {
        type: String,
        maxlength: [100, "CTO name should be under 100 characters"]
    },
    phoneNo: {
        type: String,
        maxlength: [10, "it should be exactly 10 digits"]
    },
    role: {
        type: String,
        enum: ["CTO", null],
        default: null
    },
    permission: {
        type: Object,
        default: {}
    },

    organizationId: {
        type: [Schema.Types.ObjectId],
        ref: "OrganizationModel",
        default: []
    },
    projectId: {
        type: [Schema.Types.ObjectId],
        ref: "ProjectModel",
        default: []
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
        default: null
    },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
})


CTOSchema.index({ email: 1 }, { unique: true })
CTOSchema.index({ phoneNo: 1 }, { unique: true, sparse: true });


const CTOModel = mongoose.model<ICTO>("CTOModel", CTOSchema)


export default CTOModel