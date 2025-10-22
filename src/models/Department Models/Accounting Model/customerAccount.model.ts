import mongoose, { Schema, Document, Types } from "mongoose";


export interface IUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface ICustomer extends Document {
    customerType: "business" | "individual";

    organizationId: Types.ObjectId;
    projectId: Types.ObjectId;
    clientId: Types.ObjectId;
    // salutation?: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    //   displayName: string;
    email: string | null;
    phone: {
        work: string | null;
        mobile: string | null;
    };
    customerLanguage?: string | null;

    // Other Details
    pan?: string | null;
    currency?: string;
    accountsReceivable?: string | null;
    openingBalance?: number;
    paymentTerms?: string;
    enablePortal?: boolean;
    documents?: IUpload[];
    customerOwner?: mongoose.Types.ObjectId;
}



const fileSchema = new Schema<IUpload>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const CustomerSchema = new Schema<ICustomer>(
    {
        customerType: {
            type: String,
            enum: ["business", "individual"],
            default: "business",
        },

        organizationId: {type:Schema.Types.ObjectId, ref:"OrganizationModel"},
        clientId: {type:Schema.Types.ObjectId, ref:"ClientModel"},
        projectId: {type:Schema.Types.ObjectId, ref:"ProjectModel"},
        //   salutation: { type: String },
        firstName: { type: String, default: null },
        lastName: { type: String, default: null },

        companyName: { type: String, default: null },
        // displayName: { type: String , default: null},
        email: { type: String, default: null },
        phone: {
            work: { type: String, default: null },
            mobile: { type: String, default: null },
        },
        customerLanguage: { type: String, default: "English" },

        // Other Details
        pan: { type: String, default: null },
        currency: { type: String, default: "INR - Indian Rupee" },
        accountsReceivable: { type: String, default: null },
        openingBalance: { type: Number, default: 0 },
        paymentTerms: { type: String, default: "Due on Receipt" },
        enablePortal: { type: Boolean, default: false },
        documents: { type: [fileSchema], default: [] },
        // customerOwner: {
        //   type: Schema.Types.ObjectId,
        //   ref: "User",
        // },
    },
    { timestamps: true }
);

const CustomerAccountModel = mongoose.model<ICustomer>("CustomerAccountModel", CustomerSchema);
export default CustomerAccountModel;