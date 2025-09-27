// models/shortListed.model.ts

import mongoose, { Schema, Document, Types } from "mongoose";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

export interface ShortlistReferenceDesign {
    url: string;
    originalName: string,
    tags: string[],
    type: "image";
    uploadedAt: Date;
}


export interface ShortlistedDesignDocument extends Document {
    organizationId: mongoose.Types.ObjectId;
    referenceImages: ShortlistReferenceDesign[];
}


const ShortlistUploadSchema = new Schema<ShortlistReferenceDesign>({
    type: { type: String, enum: ["image"] },
    tags: {type:[String], default:[]},
    url: { type: String, },
    originalName: String,
    // imageId: { type: Schema.Types.ObjectId, requried: false, default: null },
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


// const CategoryTypes = new Schema<CategoryType>({
//   categoryName: { type: String, default: null },
//   categoryId: {type: String},
//   designs: { type: [ShortlistUploadSchema], default: [] }
// })

const ShortlistedReferenceDesignSchema = new Schema<ShortlistedDesignDocument>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
        referenceImages: {
            type: [
                ShortlistUploadSchema
            ], default: []
        },
    },
    { timestamps: true }
);

export const ShortlistedReferenceDesignModel = mongoose.model<ShortlistedDesignDocument>(
    "ShortlistedReferenceDesignModel",
    ShortlistedReferenceDesignSchema
);
