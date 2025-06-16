import mongoose, { Schema, Types } from "mongoose"

interface ICTO extends Document {
    email: string,
    password: string,
    CTOName: string,
    phoneNo: string,
    role: string;
    organizationId?: [Types.ObjectId];
    ownerId: Types.ObjectId | null
    resetPasswordToken?: string;
    resetPasswordExpire?: number;
}


const StaffSchema: Schema<ICTO> = new Schema({
    email: {
        type: String,
        maxLength: [50, "it shoud be within 50 digits"],
        require: true,
        unique:true
    },
    password: {
        type: String,
        require: true,
        maxlength: [100, "password should be under 100 characters"]
    },
    CTOName: {
        type: String,
        unique: true,
        maxlength: [100, "CTO name should be under 100 characters"]
    },
    phoneNo: {
        type: String,
        unique: true,
        maxlength: [10, "it should be exactly 10 digits"]
    },
    role: {
        type: String,
        enum: ["CTO", null],
        default: null
    },
    organizationId: {
        type: [Schema.Types.ObjectId],
        ref: "OrganizationModel",
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


StaffSchema.index({ email: 1 , ownerId:1}, { unique: true })


const CTOModel = mongoose.model<ICTO>("CTOModel", StaffSchema)


export default CTOModel