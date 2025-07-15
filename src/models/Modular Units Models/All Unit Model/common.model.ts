import { Schema } from "mongoose";

export interface ICommonUnit {
  name: string;
  description?: string;
  price: number;
  material: string;
  images: string[]; // array of image URLs
  category: string; // e.g., 'wardrobe', 'studyTable', etc.
  createdAt?: Date;
  updatedAt?: Date;
}




export const CommonUnitsSchema = new Schema<ICommonUnit>({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  material: { type: String },
  images: [{ type: String }],
  category: { type: String, required: true },
});
