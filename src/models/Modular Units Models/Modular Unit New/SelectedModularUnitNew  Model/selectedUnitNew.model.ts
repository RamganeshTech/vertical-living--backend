import { model, Schema, Types } from "mongoose";
import { dimentionModularSchema, IModularUnit, IModularUnitUpload } from "../modularUnitNew.model";

export interface ISelectedUnit extends IModularUnit {
  _id?: Types.ObjectId,
  productId: Types.ObjectId,
  quantity: number;
  singleUnitCost: number;
}

export interface ISelectedModularUnit {
  _id?: Types.ObjectId;
  projectId: Types.ObjectId;
  selectedUnits: ISelectedUnit[];
  pdfList: IModularUnitUpload[];
  totalCost: number,
  status: string
}

const uploadSchema = new Schema<IModularUnitUpload>({
  type: { type: String, enum: ["image"] },
  url: { type: String, default: null },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });


const pdfModularSchema = new Schema<IModularUnitUpload>({
  type: { type: String, enum: ["pdf"] },
  url: { type: String, default: null },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });

const selectedUnits = new Schema<ISelectedUnit>({
  productId: { type: Schema.Types.ObjectId, ref: "ModularUnitModelNew" },
  productName: { type: String, default: null },
  attributes: { type: [String], default: [] },
  serialNo: { type: String, default: null },
  dimention: { type: dimentionModularSchema, default: {} },
  description: { type: String, default: null },
  totalAreaSqFt: { type: Number, default: null },
  materialsNeeded: { type: String, default: null },
  fabricationCost: { type: Number, default: null },
  timeRequired: { type: Number, default: null },
  price: { type: Number, default: null },
  productImages: { type: [uploadSchema], default: [] },
  "2dImages": { type: [uploadSchema], default: [] },
  "3dImages": { type: [uploadSchema], default: [] },
  category: { type: String, default: null },
  quantity: { type: Number, default: 1 },
  // 👇 cost for 1 unit (from master or overridden)
  singleUnitCost: { type: Number, default: 0 },
}, { _id: true })

const SelectedModularUnitSchema = new Schema<ISelectedModularUnit>({
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
  selectedUnits: { type: [selectedUnits], default: [] },
  pdfList: { type: [pdfModularSchema], default: [] },
  totalCost: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
}, { timestamps: true });

export const SelectedModularUnitNewModel = model("SelectedModularUnitNewModel", SelectedModularUnitSchema);