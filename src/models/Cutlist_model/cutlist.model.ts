
import mongoose, { model, Schema, Types } from 'mongoose';



export interface ICutlistImage {
    type: "image";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}


// 1. Individual Cutlist Item (Row in the table)
export interface ICutlistItem {
    sNo: number;
    measurement: string | null;
    plyThickness: string | null;
    innerFace: {
        laminateThickness: string | null;
        laminateBrand?: string;
        laminateNameCode?: string;
    };
    outerFace: {
        laminateThickness: string | null;
        laminateBrand?: string;
        laminateNameCode?: string;
    };
}

// 2. Room Structure
export interface ICutlistRoom {
    roomName: string | null;
    productName: string | null;
    backSideLaminateImage: ICutlistImage
    frontSideLaminateImage: ICutlistImage
    items: ICutlistItem[];
}

// 3. Material Summary (The bottom section requested by your MD)
export interface IMaterialSummary {
    materialType: string;
    thickness?: string;
    brand?: string;
    colorCode?: string;
    sheetsRequired: number;
}

// 4. Main Cutlist Document
export interface ICutlist {
    _id?: Types.ObjectId;
    organizationId?: Types.ObjectId;
    quoteNo: string | null
    quoteId?: Types.ObjectId; 
    projectId?: Types.ObjectId;
    clientId?: Types.ObjectId;
    cutlistNo?: string;
    versionNo: string | null;
    clientName: string | null;
    location: string | null;

    rooms: ICutlistRoom[];

    summary: {
        fabricationRate: number;
        unit: string;
        totalArea?: number;
        totalCost?: number;
        plywoodSheetSize: {
            width: number;
            height: number;
        };
        kerf: number;
        materialSummary: IMaterialSummary[];
    };

    isLocked: boolean;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}


const CutlistItemSchema = new Schema<ICutlistItem>({
    sNo: { type: Number, default: null },
    measurement: { type: String, default: null },
    plyThickness: { type: String, default: null },
    // Face Details
    innerFace: {
        laminateThickness: { type: String, default: null },
        laminateBrand: { type: String, default: null }, // ADD THIS
        laminateNameCode: { type: String, default: null }
    },
    outerFace: {
        laminateThickness: { type: String, default: null },
        laminateBrand: { type: String, default: null }, // ADD THIS
        laminateNameCode: { type: String, default: null }
    }
});



const fileSchema = new Schema<ICutlistImage>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

const RoomSchema = new Schema<ICutlistRoom>({
    roomName: { type: String, default: null }, // e.g., "Room 1"
    productName: { type: String, default: null },
    backSideLaminateImage: { type: fileSchema, default: null },
    frontSideLaminateImage: { type: fileSchema, default: null },
    items: [CutlistItemSchema]
}, { _id: true });

const CutlistSchema = new Schema<ICutlist>({
    // Header Information
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    projectId: { type: Types.ObjectId, ref: "ProjectModel" },
    quoteNo: { type: String, default: null },
    quoteId: {type:Schema.Types.ObjectId, ref:"QuoteVarientGenerateModel", default: null},
    cutlistNo: { type: String, }, // auto generated using the pre hook only during the creation not in the updation
    versionNo: { type: String, default: null }, // "1.0"
    clientName: { type: String, default: null },
    clientId: { type: Types.ObjectId, ref: "ClientModel" },
    location: { type: String, default: null },

    // Room Data
    rooms: [RoomSchema],

    // Fabrication & Plywood Summary
    summary: {
        fabricationRate: { type: Number, default: 0 },
        unit: { type: String, default: 'sqft' },
        totalArea: Number,
        totalCost: Number,
        plywoodSheetSize: {
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 }
        },
        kerf: { type: Number, default: 0 },


        // NEW: Material Requirement Summary Section
        materialSummary: [{
            thickness: {
                type: String,
                default: null
            },
            sheetsNeeded: { type: Number, default: 0 }
        }]


    },

    // Status for "Approve & Lock" functionality
    isLocked: { type: Boolean, default: false },
    status: { type: String, default: 'draft' }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});




// ✅ Pre-save hook to auto-generate unique invoice number
CutlistSchema.pre("save", async function (next) {
    if (this.isNew && !this.cutlistNo) {
          const currentYear = new Date().getFullYear();
          
        const lastDoc = await mongoose
            .model("CutlistModel")
            .findOne({organizationId: this.organizationId}, { cutlistNo: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.cutlistNo) {
            const match = lastDoc.cutlistNo.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        this.cutlistNo = `CL-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});


const CutlistModel = model('CutlistModel', CutlistSchema);

export default CutlistModel