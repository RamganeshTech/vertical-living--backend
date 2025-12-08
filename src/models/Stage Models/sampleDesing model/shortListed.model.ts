// // models/shortListed.model.ts

// import mongoose, { Schema, Document, Types } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

// interface ShortlistedDesign {
//   url: string;
//   originalName: string,
//   type: "image";
//   imageId: Types.ObjectId | null,
//   uploadedAt: Date;
// }
// export interface CategoryType {
//   categoryName: string,
//   categoryId:string,
//   designs: ShortlistedDesign[]
// }

// interface RoomShortlist {
//   roomName: string;
//   categories: CategoryType[];
// }


// export interface ShortlistedDesignDocument extends Document {
//   projectId: mongoose.Types.ObjectId;
//   shortlistedRooms: RoomShortlist[];
// }

// const ShortlistUploadSchema = new Schema<ShortlistedDesign>({
//   type: { type: String, enum: ["image"] },
//   url: { type: String, },
//   originalName: String,
//   imageId: { type: Schema.Types.ObjectId, requried: false, default: null },
//   uploadedAt: { type: Date, default: new Date() }
// }, { _id: true });


// const CategoryTypes = new Schema<CategoryType>({
//   categoryName: { type: String, default: null },
//   categoryId: {type: String},
//   designs: { type: [ShortlistUploadSchema], default: [] }
// })

// const ShortlistedDesignSchema = new Schema<ShortlistedDesignDocument>(
//   {
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
//     shortlistedRooms: [
//       {
//         roomName: { type: String, },
//         categories: { type: [CategoryTypes], default:[]}
//       },
//     ],
//   },
//   { timestamps: true }
// );


// // ShortlistedDesignSchema.plugin(procurementLogger)


// export const ShortlistedDesignModel = mongoose.model<ShortlistedDesignDocument>(
//   "ShortlistedDesignModel",
//   ShortlistedDesignSchema
// );



// models/shortListed.model.ts

import mongoose, { Schema, Document, Types } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

interface ShortlistedDesign {
  url: string;
  originalName: string,
  type: string;
  imageId: Types.ObjectId | null,
  uploadedAt: Date;
}
export interface IShortListVarient {
  type:  "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

const uploadSchema = new Schema<IShortListVarient>({
  type: { type: String, enum: ["pdf"]},
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });

export interface RoomShortlist {
  siteImage: ShortlistedDesign;
  referenceImages: ShortlistedDesign[];
}


export interface ShortlistedDesignDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  shortListedDesigns: RoomShortlist[];
  pdfLink: IShortListVarient
}

const ShortlistUploadSchema = new Schema<ShortlistedDesign>({
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

const ShortlistedDesignSchema = new Schema<ShortlistedDesignDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel",  },
    shortListedDesigns: {type: [ShortListedDesigns], default: []},
    pdfLink: {type:uploadSchema, default: null}
  },
  { timestamps: true }
);


// ShortlistedDesignSchema.plugin(procurementLogger)


export const ShortlistedDesignModel = mongoose.model<ShortlistedDesignDocument>(
  "ShortlistedDesignModel",
  ShortlistedDesignSchema
);
