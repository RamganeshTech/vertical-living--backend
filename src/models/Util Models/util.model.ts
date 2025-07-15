import { Schema, model } from "mongoose";

export interface IBrand {
  brandNames: string[];
  category: string; // e.g., 'wardrobe'
}

const BrandSchema = new Schema<IBrand>(
  {
    brandNames: [{ type: String }],
    category: { type: String},
  },
  { timestamps: true }
);

export const BrandModel = model<IBrand>("BrandModel", BrandSchema);
