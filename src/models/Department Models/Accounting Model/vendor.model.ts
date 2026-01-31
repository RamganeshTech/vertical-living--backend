import mongoose, { Schema, Document, Types } from "mongoose";


export interface IUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface IVendorLocation {
    latitude: number | null; // e.g. 40.7128
    longitude: number | null; // e.g. -74.0060
}


export interface IVendor extends Document {
    organizationId: Types.ObjectId;
    clientId: Types.ObjectId;
    firstName: string | null;
    companyName: string | null;
    shopDisplayName: string | null
    vendorCategory: string | null

    shopFullAddress?: string | null,
    email: string | null;
    phone: {
        work: string | null; //shoudl support landline also it shoudl allow 11 nunbers also for landline 
        mobile: string | null;
    };
    location?: IVendorLocation;
    mapUrl?: string | null
    language?: string | null;
    shopImages?: IUpload[]


    // Other Details
    pan?: string | null;
    tan?: string | null;
    gstin?: string | null;
    msmeNo?: string | null;
    cin?: string | null;
    businessStructure: string | null

    bankAccNo: string | null
    accHolderName: string | null,
    bankName: string | null
    upiId?: string | null
    bankBranch: string | null
    ifscCode: string | null
    paymentTerms: string | null
    openingBalance?: number;

    currency?: string;
    // accountsPayable?: string | null;
    // TDS: string;
    documents?: IUpload[];
    // customerOwner?: mongoose.Types.ObjectId;

    mainImage?: IUpload
    priority: string[]


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
        clientId: { type: Schema.Types.ObjectId, ref: "ClientModel", default: null },
        //   salutation: { typ`e: String },
        firstName: { type: String, default: null },
        companyName: { type: String, default: null },
        shopDisplayName: { type: String, default: null },
        vendorCategory: { type: String, default: null }, // Added

        email: { type: String, default: null },
        phone: {
            work: { type: String, default: null },
            mobile: { type: String, default: null },
        },
        language: { type: String, default: "English" },
        shopFullAddress: { type: String, default: null }, // Added

        mapUrl: { type: String, default: null },

        location: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null }
        },

        // Statutory Details (Added)
        pan: { type: String, default: null },
        tan: { type: String, default: null },
        gstin: { type: String, default: null },
        msmeNo: { type: String, default: null },
        cin: { type: String, default: null },
        businessStructure: { type: String, default: null },

        // Banking Details (Added)
        bankAccNo: { type: String, default: null },
        accHolderName: { type: String, default: null },
        bankName: { type: String, default: null },
        upiId: { type: String, default: null },
        bankBranch: { type: String, default: null },
        ifscCode: { type: String, default: null },

        // Financials
        currency: { type: String, default: "INR - Indian Rupee" },
        openingBalance: { type: Number, default: 0 },
        paymentTerms: { type: String, default: "Due on Receipt" },

        shopImages: { type: [fileSchema], default: [] }, // Added
        documents: { type: [fileSchema], default: [] },
        mainImage: { type: fileSchema, default: null },
        priority: { type: [String], default: [] },

    },
    { timestamps: true }
);

const VendorAccountModel = mongoose.model<IVendor>("VendorAccountModel", VendorSchema);
export default VendorAccountModel;