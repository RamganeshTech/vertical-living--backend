import mongoose, { Schema } from "mongoose"

interface IUser extends Document {
    email: string,
    password: string,
    username: string,
    phoneNo: string,
    resetPasswordToken?: string;
  resetPasswordExpire?: number;
}


const UserSchema: Schema<IUser> = new Schema({
    email: {
        type: String,
        maxLength: [50, "it shoud be within 50 digits"],
        unique: true,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    username: {
        type: String,
        unique: true
    },
    phoneNo: {
        type: String,
        unique: true,
        maxlength:[10, "it should be exactly 10 digits"]
    },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
})


const UserModel = mongoose.model<IUser>("UserModel", UserSchema)


export default UserModel