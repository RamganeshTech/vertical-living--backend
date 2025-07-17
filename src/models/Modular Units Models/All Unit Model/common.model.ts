import { Schema, Types } from "mongoose";

export interface ICommonUnit {
  organizationId: Types.ObjectId
  name: string;
  description?: string;
  price: number;
  material: string;
  customId?: string
  images: CommonUpload[]; // array of image URLs
  category: string; // e.g., 'wardrobe', 'studyTable', etc.
  createdAt?: Date;
  updatedAt?: Date;
}


export interface CommonUpload {
  type: "image";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

const uploadSchema = new Schema<CommonUpload>({
  type: { type: String, enum: ["image"] },
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });


export const CommonUnitsSchema = new Schema<ICommonUnit>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  name: { type: String, required: true },
  customId: { type: String, },
  description: { type: String, default: "" },
  price: { type: Number, default: 0 },
  material: { type: String, default: "" },
  images: { type: [uploadSchema], default: [] },
  category: { type: String, default: "" },
});
