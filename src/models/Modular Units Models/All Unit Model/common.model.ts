import { Schema } from "mongoose";

export interface ICommonUnit {
  name: string;
  description?: string;
  price: number;
  material: string;
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
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number,  },
  material: { type: String },
  images: { type: [uploadSchema] , default:[]},
  category: { type: String,  },
});
