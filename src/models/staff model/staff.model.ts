import mongoose, { Schema, Types } from "mongoose"

interface IStaff extends Document {
    email: string,
    password: string,
    staffName: string,
    phoneNo: string,
    role: string;
    organizationId?: [Types.ObjectId];
    ownerId: Types.ObjectId | null
    resetPasswordToken?: string;
    resetPasswordExpire?: number;
}


const StaffSchema: Schema<IStaff> = new Schema({
    email: {
        type: String,
        maxLength: [50, "it shoud be within 50 digits"],
        require: true
    },
    password: {
        type: String,
        require: true,
        maxlength: [100, "password should be under 100 characters"]
    },
    staffName: {
        type: String,
        unique: true,
        maxlength: [100, "staffname should be under 100 characters"]
    },
    phoneNo: {
        type: String,
        unique: true,
        maxlength: [10, "it should be exactly 10 digits"]
    },
    role: {
        type: String,
        enum: ["staff", null],
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


const StaffModel = mongoose.model<IStaff>("StaffModel", StaffSchema)


export default StaffModel