import mongoose, { Schema, Document, Types } from "mongoose";


export interface IUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface IVendorLocation {
    address: string | null; // Human readable string (e.g. "123 Main St, New York")
    latitude: number | null; // e.g. 40.7128
    longitude: number | null; // e.g. -74.0060
}


export interface IVendor extends Document {
    // customerType: "business" | "individual";
    organizationId: Types.ObjectId;
    // projectId: Types.ObjectId;
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
    vendorLanguage?: string | null;

    // Other Details
    pan?: string | null;
    currency?: string;
    accountsPayable?: string | null;
    openingBalance?: number;
    paymentTerms?: string;
    TDS: string;
    documents?: IUpload[];
    // customerOwner?: mongoose.Types.ObjectId;

    location?: IVendorLocation;
    mainImage?: IUpload

}


const fileSchema = new Schema<IUpload>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const VendorSchema = new Schema<IVendor>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
        clientId: { type: Schema.Types.ObjectId, ref: "ClientModel" },
        //   salutation: { type: String },
        firstName: { type: String, default: null },
        // lastName: { type: String, default: null },

        companyName: { type: String, default: null },
        // displayName: { type: String , default: null},
        email: { type: String, default: null },
        phone: {
            work: { type: String, default: null },
            mobile: { type: String, default: null },
        },
        vendorLanguage: { type: String, default: "English" },

        // Other Details
        pan: { type: String, default: null },
        currency: { type: String, default: "INR - Indian Rupee" },
        accountsPayable: { type: String, default: null },
        openingBalance: { type: Number, default: 0 },
        paymentTerms: { type: String, default: "Due on Receipt" },
        // enablePortal: { type: Boolean, default: false },
        TDS: { type: String, default: null },
        documents: { type: [fileSchema], default: [] },
        // customerOwner: {
        //   type: Schema.Types.ObjectId,
        //   ref: "User",
        // },
        location: {
            address: { type: String, default: null },
            mapUrl: { type: String }, // Store the raw link
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null }
        },
        mainImage: { type: fileSchema, default: null }
    },
    { timestamps: true }
);

const VendorAccountModel = mongoose.model<IVendor>("VendorAccountModel", VendorSchema);
export default VendorAccountModel;