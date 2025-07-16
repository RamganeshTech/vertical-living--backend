
/** Final TypeScript interface */

import { model, Schema } from "mongoose";
import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

import {
  ShoeRackUnitType, ShoeRackCapacity, ShoeRackDoorType,
  CarcassMaterial, ShutterMaterial, FinishType, HeightCategory,
  ShoeTypesSupported, VentilationFeature, AddOnFeatures, PlacementArea,
  InstallationType, BudgetRange,
  ShoeRackVisibilityType,
  ShoeRackModularType
} from "./shoeRackTypes";

export interface IShoeRackUnit extends ICommonUnit {
  unitType?: ShoeRackUnitType;
  capacity?: ShoeRackCapacity;
  doorType?: ShoeRackDoorType;
  carcassMaterial?: CarcassMaterial;
  shutterMaterial?: ShutterMaterial;
  finish?: FinishType;
  heightCategory?: HeightCategory;
  shoeTypesSupported?: ShoeTypesSupported[];
  ventilationFeature?: VentilationFeature;
  visibilityType?: ShoeRackVisibilityType;
  modularType?: ShoeRackModularType;

  addOnFeatures?: AddOnFeatures[];
  placementArea?: PlacementArea[];
  installationType?: InstallationType;
  budgetRange?: BudgetRange;
}

/** Mongoose Schema */

export const ShoeRackUnitSchema = new Schema<IShoeRackUnit>(
  {
    ...CommonUnitsSchema.obj,
    unitType: { type: String, enum: Object.values(ShoeRackUnitType) },
    capacity: { type: String, enum: Object.values(ShoeRackCapacity) },
    doorType: { type: String, enum: Object.values(ShoeRackDoorType) },
    carcassMaterial: { type: String, enum: Object.values(CarcassMaterial) },
    shutterMaterial: { type: String, enum: Object.values(ShutterMaterial) },
    finish: { type: String, enum: Object.values(FinishType) },
    heightCategory: { type: String, enum: Object.values(HeightCategory) },
    shoeTypesSupported: [{ type: String, enum: Object.values(ShoeTypesSupported) }],
    ventilationFeature: { type: String, enum: Object.values(VentilationFeature) },
    visibilityType: { type: String, enum: Object.values(ShoeRackVisibilityType) },
    modularType: { type: String, enum: Object.values(ShoeRackModularType) },
    addOnFeatures: [{ type: String, enum: Object.values(AddOnFeatures) }],
    placementArea: [{ type: String, enum: Object.values(PlacementArea) }],
    installationType: { type: String, enum: Object.values(InstallationType) },
    budgetRange: { type: String, enum: Object.values(BudgetRange) },
  },
  { timestamps: true }
);

export const ShoeRackUnitModel = model<IShoeRackUnit>(
  "ShoeRackUnitModel",
  ShoeRackUnitSchema
);
