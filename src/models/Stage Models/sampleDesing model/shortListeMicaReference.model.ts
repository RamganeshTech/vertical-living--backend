// models/shortListed.model.ts

import mongoose, { Schema, Document, Types } from "mongoose";
import { ShortlistedDesignDocument, ShortlistReferenceDesign } from "./shortlistReferenceDesign.model";

export interface ShortlistMicaDesign extends ShortlistReferenceDesign {
   
}


export interface ShortlistedMicaDocument extends ShortlistedDesignDocument {
  }


const ShortlistUploadSchema = new Schema<ShortlistMicaDesign>({
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

const ShortlistedMicaDesignSchema = new Schema<ShortlistedMicaDocument>(
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

export const ShortlistedMicaReferenceDesignModel = mongoose.model<ShortlistedDesignDocument>(
    "ShortlistedMicaReferenceDesignModel",
    ShortlistedMicaDesignSchema
);
