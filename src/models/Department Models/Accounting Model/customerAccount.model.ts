import mongoose, { Schema, Document, Types } from "mongoose";


export interface IUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface ICustomer extends Document {
    organizationId: Types.ObjectId;
    projectId: Types.ObjectId;
    clientId: Types.ObjectId;
    firstName: string | null;
    companyName: string | null;
    mainImage?: IUpload | null
    email: string | null;
    phone: {
        work: string | null;
        mobile: string | null;
    }


    pan?: string | null;
    tan?: string | null;
    gstin?: string | null;
    language?: string | null;


    bankAccNo: string | null
    accHolderName: string | null,
    bankName: string | null
    bankBranch: string | null
    ifscCode: string | null
    // Other Details
    currency?: string;
    documents?: IUpload[];
}



const fileSchema = new Schema<IUpload>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const CustomerSchema = new Schema<ICustomer>(
    {


        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
        clientId: { type: Schema.Types.ObjectId, ref: "ClientModel" },
        projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
        firstName: { type: String, default: null },

        companyName: { type: String, default: null },
        email: { type: String, default: null },
        phone: {
            work: { type: String, default: null },    //shoudl support landline also it shoudl allow 11 nunbers also for landline 
            mobile: { type: String, default: null },
        },

        
        // Statutory  Details
        language: { type: String, default: "English" },
        pan: { type: String, default: null },
        tan: { type: String, default: null },
        gstin: { type: String, default: null },
        currency: { type: String, default: "INR - Indian Rupee" },

        // bank details
        bankAccNo: { type: String, default: null },
        accHolderName: { type: String, default: null },
        bankName: { type: String, default: null },
        bankBranch: { type: String, default: null },
        ifscCode: { type: String, default: null },

        mainImage: { type: fileSchema, default: null },
         documents: { type: [fileSchema], default: [] },
        
    },
    { timestamps: true }
);

const CustomerAccountModel = mongoose.model<ICustomer>("CustomerAccountModel", CustomerSchema);
export default CustomerAccountModel;