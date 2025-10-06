

// models/shortListed.model.ts

import mongoose, { Schema, Document, Types } from "mongoose";

interface ShortlistedMicaDesign {
  url: string;
  originalName: string,
  type: string;
  imageId: Types.ObjectId | null,
  uploadedAt: Date;
}
export interface IShortListMicaVarient {
  type:  "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

const uploadSchema = new Schema<IShortListMicaVarient>({
  type: { type: String, enum: ["pdf"]},
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });

export interface RoomShortlist {
  siteImage: ShortlistedMicaDesign;
  referenceImages: ShortlistedMicaDesign[];
}


export interface ShortlistedMicaDesignDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  shortListedDesigns: RoomShortlist[];
  pdfLink: IShortListMicaVarient
}

const ShortlistUploadSchema = new Schema<ShortlistedMicaDesign>({
  type: { type: String, enum: ["image"] },
  url: { type: String, },
  originalName: String,
  imageId: { type: Schema.Types.ObjectId, requried: false, default: null },
  uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


// const CategoryTypes = new Schema<CategoryType>({
//   categoryName: { type: String, default: null },
//   categoryId: {type: String},
//   designs: { type: [ShortlistUploadSchema], default: [] }
// })

const ShortListedDesigns  = new Schema({
        siteImage: { type: ShortlistUploadSchema, default: null},
        referenceImages: { type: [ShortlistUploadSchema], default:[]}
      }, {_id:true})

const ShortlistedMicaDesignSchema = new Schema<ShortlistedMicaDesignDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel",  },
    shortListedDesigns: {type: [ShortListedDesigns], default: []},
    pdfLink: {type:uploadSchema, default: null}
  },
  { timestamps: true }
);


// ShortlistedMicaDesignSchema.plugin(procurementLogger)


export const ShortlistedMicaDesignModel = mongoose.model<ShortlistedMicaDesignDocument>(
  "ShortlistedMicaDesignModel",
  ShortlistedMicaDesignSchema
);
