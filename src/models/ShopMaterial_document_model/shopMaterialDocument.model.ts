import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialFile {
  type: "image" | "pdf";
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
  url: { type: String,  },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() },
  isExtracted: {type: Boolean, default:false}
}, {_id: true});

const MaterialShopDocumentSchema: Schema = new Schema({
  categoryName: {
    type: String,
    default: null,
    // required: true // Added required since you categorize them
  },
  // file: {
  //   type: {
  //     type: String, enum: ["image", "pdf"],
  //   },
  //   url: { type: String, },
  //   originalName: { type: String, },
  //   uploadedAt: { type: Date, default: new Date() }
  // },

  file: {type:[fileSchema], default: []},

  extractDetails: {
    type: [extractedDetails],
    default: []
  },
}, { timestamps: true });

export const MaterialShopDocumentModel = mongoose.model<IMaterialShopDocument>(
  'MaterialShopDocument',
  MaterialShopDocumentSchema
);