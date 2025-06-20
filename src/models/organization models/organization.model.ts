import mongoose, { Document, Schema, Types } from "mongoose";

// 1. Define the TypeScript interface
export interface IOrganization extends Document {
    userId:Types.ObjectId,
    organizationName: string;
    type?: string;
    address?: string;
    logoUrl?: string;
    organizationPhoneNo?: string

}

// 2. Create the schema
const OrganizationSchema = new Schema<IOrganization>({
    organizationName: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    logoUrl: {
        type: String,
        default: "",
    },
    organizationPhoneNo: {
        type: String,
        default: "",
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: "UserModel",
        default: null
    }
}, {
    timestamps: true
});

// 3. Export the model
const OrganizationModel = mongoose.model<IOrganization>("OrganizationModel", OrganizationSchema);
export default OrganizationModel;
