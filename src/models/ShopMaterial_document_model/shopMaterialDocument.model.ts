import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMaterialFile {
  type: string;
  url: string;
  originalName: string;
  uploadedAt: Date;
  isExtracted: boolean
}


interface IExtractedShopQuoteDetails {
  brand: string
  itemName: string
}

export interface IMaterialShopDocument extends Document {
  organizationId: Types.ObjectId
  materialCategoryId: Types.ObjectId
  categoryName: string | null;
  file: IMaterialFile[];
  extractDetails: IExtractedShopQuoteDetails[]
}


const extractedDetails = new Schema({
  brand: { type: String, default: null },
  itemName: { type: String, default: null }
}, { _id: true })


const fileSchema = new Schema<IMaterialFile>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String, },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() },
  isExtracted: { type: Boolean, default: false }
}, { _id: true });

const MaterialShopDocumentSchema: Schema = new Schema<IMaterialShopDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  materialCategoryId: { type: Schema.Types.ObjectId, ref: "MaterialCategoryModel", default: null },
  categoryName: {
    type: String,
    default: null,
  },

  file: { type: [fileSchema], default: [] },

  extractDetails: {
    type: [extractedDetails],
    default: []
  },
}, { timestamps: true });


MaterialShopDocumentSchema.index({ organizationId: 1 })

export const MaterialShopDocumentModel = mongoose.model<IMaterialShopDocument>(
  'MaterialShopDocument',
  MaterialShopDocumentSchema
);