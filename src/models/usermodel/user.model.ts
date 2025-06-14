import mongoose, { Schema, Types } from "mongoose"

interface IUser extends Document {
    email: string,
    password: string,
    username: string,
    phoneNo: string,
    role: string;
    organizationId?: [Types.ObjectId];
    resetPasswordToken?: string;
    resetPasswordExpire?: number;
}


const UserSchema: Schema<IUser> = new Schema({
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
    username: {
        type: String,
        unique: true,
        maxlength: [100, "username should be under 100 characters"]
    },
    phoneNo: {
        type: String,
        unique: true,
        maxlength: [10, "it should be exactly 10 digits"]
    },
    role: {
        type: String,
        enum: ["owner", null],
        default: null
    },
    organizationId: {
        type: [Schema.Types.ObjectId],
        ref: "OrganizationModel",
        default:[]
    },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
})


UserSchema.index({ email: 1 }, { unique: true })


const UserModel = mongoose.model<IUser>("UserModel", UserSchema)


export default UserModel