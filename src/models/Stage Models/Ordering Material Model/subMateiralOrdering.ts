import { Schema } from "mongoose";


export interface ICarpentryItem {
  material: string;
  brandName: string;
  specification: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface IHardwareItem {
  item: string;
  size: string;
  material: string;
  brandName: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface IElectricalFittingItem {
  item: string;
  specification: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface ITileItem {
  type: string;
  brandName: string;
  size: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface ICeramicSanitarywareItem {
  item: string;
  specification: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface IPaintItem {
  type: string;
  brandName: string;
  color: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface ILightFixtureItem {
  type: string;
  brandName: string;
  specification: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface IGlassMirrorItem {
  type: string;
  brandName: string;
  size: string;
  thickness: string;
  quantity: number;
  remarks: string;
}

export interface IUpholsteryCurtainItem {
  item: string;
  fabric: string;
  color: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface IFalseCeilingItem {
  item: string;
  specification: string;
  quantity: number;
  unit: string;
  remarks: string;
}



// Carpentry
export const CarpentryOrderMaterialSchema = new Schema({
  material: String,
  brandName: String,
  specification: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Hardware
export const HardwareOrderMaterialSchema = new Schema({
  item: String,
  size: String,
  material: String,
  brandName: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Electrical Fittings
export const ElectricalFittingOrderMaterialSchema = new Schema({
  item: String,
  specification: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Tiles
export const TileOrderMaterialSchema = new Schema({
  type: String,
  brandName: String,
  size: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Ceramic & Sanitaryware
export const CeramicSanitarywareOrderMaterialSchema = new Schema({
  item: String,
  specification: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Paints & Coatings
export const PaintOrderMaterialSchema = new Schema({
  type: String,
  brandName: String,
  color: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Lights & Fixtures
export const LightFixtureOrderMaterialSchema = new Schema({
  type: String,
  brandName: String,
  specification: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// Glass & Mirrors
export const GlassMirrorOrderMaterialSchema = new Schema({
  type: String,
  brandName: String,
  size: String,
  thickness: String,
  quantity: Number,
  remarks: String,
}, { _id: true });

// Upholstery & Curtains
export const UpholsteryCurtainOrderMaterialSchema = new Schema({
  item: String,
  fabric: String,
  color: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });

// False Ceiling Materials
export const FalseCeilingOrderMaterialSchema = new Schema({
  item: String,
  specification: String,
  quantity: Number,
  unit: String,
  remarks: String,
}, { _id: true });
