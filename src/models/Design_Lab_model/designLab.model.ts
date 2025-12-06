// src/interfaces/designLab.interface.ts

import { Document, Types } from "mongoose";

// ==========================================
// REUSABLE UPLOAD INTERFACE
// ==========================================
export interface IUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

// ==========================================
// SECTION 3: DESIGN COMPONENTS - MATERIAL
// ==========================================
export interface IMaterial {
    image: IUpload | null;
    materialName: string;
    vendorName: string;
    vendorId: Types.ObjectId;
    rate: number;
    unit:
    | "Nos"
    | "Sqft"
    | "Sqmt"
    | "Rft"
    | "mm"
    | "Meters"
    | "Kg"
    | "Liters"
    | "Sheets"
    | "Box"
    | "Set"
    | "Bundle";
    labourCost: number;
    specsNotes: string;
}

// ==========================================
// SECTION 3: DESIGN COMPONENT
// ==========================================
export interface IComponent {
    componentName: string;
    materials: IMaterial[];
    //   isExpanded?: boolean; // For UI state (optional)
}

// ==========================================
// SECTION 5: SEQUENCE STEP
// ==========================================
export interface ISequenceStep {
    stepNumber: number;
    description: string;
}

// ==========================================
// MAIN DESIGN LAB INTERFACE
// ==========================================
export interface IDesignLab {
    _id?: Types.ObjectId
    // ========== SECTION 1: BASIC DETAILS ==========
    organizationId: Types.ObjectId
    designerName: string;
    designerId?: Types.ObjectId; // Reference to User/Designer from CRM
    deignerModel: string,
    designDate: Date;
    designCode: string; // Auto-generated like "DL-AUTO-2023"
    productName: string;
    spaceType:
    | "Bedroom"
    | "Living Room"
    | "Kitchen"
    | "Bathroom"
    | "Foyer"
    | "Commercial";
    difficultyLevel:
    | "Beginner"
    | "Intermediate"
    | "Advanced"
    | "Factory Pro";

    // ========== SECTION 2: REFERENCE IMAGES ==========
    referenceImages: IUpload[];

    // ========== SECTION 3: DESIGN COMPONENTS ==========
    components: IComponent[];

    // ========== SECTION 4: PROS, CONS & LOGIC ==========
    pros: string;
    cons: string;
    mistakes: string; // Mistakes to Avoid
    visualLogic: string; // Explain the Visual Logic
    variations: string; // Recommended Combinations / Variations

    // ========== SECTION 5: SEQUENCE OF OPERATIONS ==========
    sequenceOfOperations: ISequenceStep[];

    // ========== METADATA ==========
    status?: "draft" | "published" | "archived";
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}


// src/models/designLab.model.ts

import mongoose, { Schema, Model } from "mongoose";
// ==========================================
// ENUMS / CONSTANTS
// ==========================================
export const SPACE_TYPES = ["Bedroom","Living Room","Kitchen","Bathroom","Foyer","Commercial",
] as const;

export const DIFFICULTY_LEVELS = ["Beginner","Intermediate","Advanced","Factory Pro",
] as const;

export const MATERIAL_UNITS = ["Nos","Sqft","Sqmt","Rft","mm","Meters","Kg","Liters","Sheets","Box","Set","Bundle",
] as const;

export const UPLOAD_TYPES = ["image", "pdf"] as const;

export const DESIGN_STATUS = ["draft", "published", "archived"] as const;

// ==========================================
// SUB-SCHEMAS
// ==========================================

/**
 * Upload Schema - Reusable for any image/pdf upload
 */

const UploadSchema = new Schema<IUpload>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


/**
 * Material Schema - For each material row in a component
 */
const MaterialSchema = new Schema<IMaterial>(
    {
        image: {type: UploadSchema,default: null,},
        materialName: {type: String,},
        vendorId: {type: Schema.Types.ObjectId,},
        vendorName: {type: String,},
        rate: {type: Number,},
        unit: {type: String,},
        labourCost: {type: Number,default: 0,},
        specsNotes: {type: String,default: null,},
    },
    { _id: true }
);

/**
 * Component Schema - Contains multiple materials + its own pros/cons/mistakes
 */
const ComponentSchema = new Schema<IComponent>(
    {
        componentName: { type: String, },
        materials: { type: [MaterialSchema], default: [], },
    },
    { _id: true }
);

/**
 * Sequence Step Schema - For sequence of operations
 */
const SequenceStepSchema = new Schema<ISequenceStep>(
    {
        stepNumber: { type: Number, },
        description: { type: String },
    },
    { _id: true }
);

// ==========================================
// MAIN DESIGN LAB SCHEMA
// ==========================================
const DesignLabSchema = new Schema<IDesignLab>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel"
        },        // ========== SECTION 1: BASIC DETAILS ==========
        designerName: { type: String },
        designerId: {
            type: Schema.Types.ObjectId, refPath: "deignerModel",
        },
        deignerModel: { type: String },
        designDate: { type: Date, default: new Date() },
        designCode: { type: String },
        productName: { type: String, },
        spaceType: { type: String },
        difficultyLevel: { type: String },

        // ========== SECTION 2: REFERENCE IMAGES ==========
        referenceImages: { type: [UploadSchema], default: [] },

        // ========== SECTION 3: DESIGN COMPONENTS ==========
        components: { type: [ComponentSchema], default: [] },

        // ========== SECTION 4: PROS, CONS & LOGIC (Overall Design) ==========
        pros: { type: String, default: null, },
        cons: { type: String, default: null },
        mistakes: { type: String, default: null },
        visualLogic: { type: String, default: null },
        variations: { type: String, default: null },

        // ========== SECTION 5: SEQUENCE OF OPERATIONS ==========
        sequenceOfOperations: { type: [SequenceStepSchema], default: [] },

        status: { type: String, default: "draft" },
    },
    {
        timestamps: true,
    }
);


// ==========================================
// PRE-SAVE MIDDLEWARE
// ==========================================
DesignLabSchema.pre("save", async function (next) {
    if (this.isNew && !this.designCode) {
        const currentYear = new Date().getFullYear();

        const lastDoc = await mongoose
            .model("DesignLabModel")
            .findOne({ organizationId: this.organizationId }, { designCode: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.designCode) {
            const match = lastDoc.designCode.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        this.designCode = `DL-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

// ==========================================
// MODEL EXPORT
// ==========================================
const DesignLabModel = mongoose.model<IDesignLab>(
    "DesignLabModel",
    DesignLabSchema
);

export default DesignLabModel;