
/** Final TypeScript interface */

import mongoose, { model, Schema, Types } from "mongoose";



export interface IModularUnitUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}



export interface IParts {
  [key: string]: any;
}
export interface IModularUnit {
  organizationId: Types.ObjectId
  // productName: string;
  attributes: string[];
  serialNo: string;
  dimention: {
    height: number,
    width: number,
    depth: number,
  }
  description?: string;
  totalAreaSqFt: number,
  materialsNeeded: string,
  fabricationCost: number,
  timeRequired: number,
  price: number;
  parts: IParts[];
  productImages: IModularUnitUpload[];
  "2dImages": IModularUnitUpload[];
  "3dImages": IModularUnitUpload[];
  "cutlistDoc": IModularUnitUpload[];
  category: string; // e.g., 'wardrobe', 'studyTable', etc.
  createdAt?: Date;
  updatedAt?: Date;
}

const uploadSchema = new Schema<IModularUnitUpload>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String, default: null },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });

// Updated Parts Schema using Mixed type
const partsSchema = new Schema({}, {
  strict: false, // Allows fields not explicitly defined
  _id: true
});

export const dimentionModularSchema = new Schema({
  height: { type: Number, default: null },
  width: { type: Number, default: null },
  depth: { type: Number, default: null },
}, { _id: false })

/** CommonUnitsSchema aligned with ICommonUnit */
export const ModularUnitSchemaNew = new Schema<IModularUnit>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    // productName: { type: String, default: null },
    attributes: { type: [String], default: [] },
    serialNo: { type: String, default: null },
    dimention: { type: dimentionModularSchema, default: {} },
    description: { type: String, default: null },
    totalAreaSqFt: { type: Number, default: null },
    materialsNeeded: { type: String, default: null },
    fabricationCost: { type: Number, default: null },
    timeRequired: { type: Number, default: null },
    parts: { type: [partsSchema], default: [] },
    price: { type: Number, default: null },
    productImages: { type: [uploadSchema], default: [] },
    "2dImages": { type: [uploadSchema], default: [] },
    "3dImages": { type: [uploadSchema], default: [] },
    "cutlistDoc": { type: [uploadSchema], default: [] },
    category: { type: String, default: null },
  },
  { timestamps: true }
);


/** Model export */
export const ModularUnitModelNew = model<IModularUnit>("ModularUnitModelNew", ModularUnitSchemaNew);