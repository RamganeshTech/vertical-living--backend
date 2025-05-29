// models/Client.ts
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IClient extends Document {
    clientName: string;
    email: string;
    phoneNo?: string;
    company?: (string | null);
    password: string; // optional if you want login
    resetPasswordToken?: string,
    resetPasswordExpire?: number
}

const ClientSchema: Schema<IClient> = new Schema({
    clientName: { type: String, required: true },
    email: { type: String, required: true, unique: true, maxLength: [50, "it shoud be within 50 digits"], },
    phoneNo: { type: String, unique: true, maxLength: [10, "phoneNo shoud be only 10 digits"] },
    company: { type: String, default: null, maxlength: [50, "comapny name should not be more than 50 digits"] },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
});

const ClientModel: Model<IClient> = mongoose.model<IClient>("ClientModel", ClientSchema);

export default ClientModel;
