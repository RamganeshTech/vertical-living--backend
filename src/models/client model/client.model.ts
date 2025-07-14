// models/Client.ts
import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IClient extends Document {
    clientName: string;
    email: string;
    role: string;
    phoneNo?: string;
    location: string;
    // company?: (string | null);
    password: string; // optional if you want login
    resetPasswordToken?: string,
    resetPasswordExpire?: number,
    projectId: Types.ObjectId
    organizationId: Types.ObjectId[]
    ownerId: Types.ObjectId
}

const ClientSchema: Schema<IClient> = new Schema({
    clientName: { type: String, required: true },
    email: { type: String, required: true,  maxLength: [50, "it shoud be within 50 digits"], },
    phoneNo: { type: String,  maxLength: [10, "phoneNo shoud be only 10 digits"] },
    location: {type: String},
    role: { type: String },
    // company: { type: String, default: null, maxlength: [50, "comapny name should not be more than 50 digits"] },
    password: { type: String, required: true },
    projectId: {type: Schema.Types.ObjectId, required: true, ref:"ProjectModel"},
    ownerId: {type: Schema.Types.ObjectId, required: true, ref:"UserModel"},
    organizationId: { type: [Schema.Types.ObjectId], ref: "OrganizationModel", required: true, default: [] },
    resetPasswordToken: { type: String },  // Token for password reset
    resetPasswordExpire: { type: Number },
}, {
    timestamps: true
});


ClientSchema.index({ email: 1, projectId: 1 }, { unique: true });
ClientSchema.index({ phoneNo: 1, projectId: 1 }, { unique: true, sparse: true });

const ClientModel: Model<IClient> = mongoose.model<IClient>("ClientModel", ClientSchema);

export default ClientModel;
