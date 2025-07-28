// models/shortListed.model.ts

import mongoose, { Schema, Document , Types} from "mongoose";

interface ShortlistedDesign {
  url: string;
  originalName: string,
  type: "image";
  imageId: Types.ObjectId | null,
  uploadedAt: Date;
}

interface RoomShortlist {
  roomName: string;
  designs: ShortlistedDesign[];
}

export interface ShortlistedDesignDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  shortlistedRooms: RoomShortlist[];
}



const ShortlistUploadSchema = new Schema<ShortlistedDesign>({
  type: { type: String, enum: ["image"] },
  url: { type: String, },
  originalName: String,
  imageId: {type: Schema.Types.ObjectId, requried:false, default:null},
  uploadedAt: { type: Date, default: new Date() }
}, {_id: true});

const ShortlistedDesignSchema = new Schema<ShortlistedDesignDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
    shortlistedRooms: [
      {
        roomName: { type: String,},
        designs: {type:[ShortlistUploadSchema], default:[]}
      },
    ],
  },
  { timestamps: true }
);

export const ShortlistedDesignModel = mongoose.model<ShortlistedDesignDocument>(
  "ShortlistedDesignModel",
  ShortlistedDesignSchema
);
