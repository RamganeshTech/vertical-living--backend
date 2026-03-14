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
        whatsappNumber: string | null;
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


    // Capability Fields (Merged from Table 5)
    // workType: string[];          // e.g., ["Carpentry", "Civil", "Painting"] [cite: 163-172]
    // workSubtype: string[];       // e.g., ["Modular Kitchen", "Wardrobes", "TV Unit"] [cite: 179-181]
    // skillLevel: string;          // e.g., "Intermediate", "Expert"
    // premiumCapable: boolean;     // [cite: 206]
    // luxuryCapable: boolean;      // [cite: 207]
    // inhouseManufacturing: boolean; // Does the vendor have their own factory? [cite: 205]
    // installationTeamAvailable: boolean; // [cite: 211]
    // serviceTeamAvailable: boolean; // For after-sales/repairs [cite: 177]

    // // Capacity & Performance
    // maxProjectValue: number;     // Highest ticket size they can handle [cite: 299]
    // maxMonthlyCapacity: number;  // Number of projects per month [cite: 212]
    // avgTurnaroundDays: number;   // SLA: how many days for typical execution [cite: 292]

    // // Management/Decision fields
    // vendorGrade: string;         // e.g., "A+", "A", "B", "C" [cite: 509-513]
    // qualityCheckScore: number;

    
    notes: string | null;


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
            whatsappNumber: { type: String, default: null },
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



        // // --- NEW: Capability & Work Type Details ---
        // workType: { 
        //     type: [String], 
        //     default: [], 
        //     enum: ["Carpentry", "Modular Factory", "Civil", "Painting", "Electrical", "Plumbing", "False Ceiling", "Aluminium/Glass", "Turnkey"] 
        // }, // [cite: 163-176]
        
        // workSubtype: { 
        //     type: [String], 
        //     default: [], 
        //     enum: ["Kitchen", "Wardrobe", "TV Unit", "Crockery", "Pooja", "Study Units", "Loose Furniture"] 
        // }, // [cite: 179-186]

        // skillLevel: { type: String, enum: ["Basic", "Intermediate", "Expert"], default: "Basic" },
        // premiumCapable: { type: Boolean, default: false }, // [cite: 206]
        // luxuryCapable: { type: Boolean, default: false }, // [cite: 207]
        // inhouseManufacturing: { type: Boolean, default: false }, // [cite: 205]
        // installationTeamAvailable: { type: Boolean, default: true }, // [cite: 211]
        // serviceTeamAvailable: { type: Boolean, default: false }, // [cite: 177]

        // // --- NEW: Capacity & Performance Metrics ---
        // maxProjectValue: { type: Number, default: 0 }, // For budget filtering [cite: 299]
        // maxMonthlyCapacity: { type: Number, default: 0 }, // Monthly project limit [cite: 212]
        // avgTurnaroundDays: { type: Number, default: 0 }, // Estimated SLA for delivery [cite: 292]
        
        // // --- NEW: Grading & Scoring ---
        // vendorGrade: { 
        //     type: String, 
        //     enum: ["A+", "A", "B", "C", "Trial", "Suspended"], 
        //     default: "Trial" 
        // }, // [cite: 509-515]
        // qualityCheckScore: { type: Number, min: 0, max: 100, default: 0 }, // Out of 100 [cite: 239, 496]
        
        notes: { type: String, default: null }, // [cite: 138]

    },
    { timestamps: true }
);

const VendorAccountModel = mongoose.model<IVendor>("VendorAccountModel", VendorSchema);
export default VendorAccountModel;