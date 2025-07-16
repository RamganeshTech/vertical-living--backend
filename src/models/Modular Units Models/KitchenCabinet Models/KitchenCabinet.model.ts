import { ICommonUnit } from "../All Unit Model/common.model";
import {
  KitchenUnitType,
  InternalLayout,
  Compartments,
  FeatureTags,
  Dimensions,
  CarcassMaterial,
  DoorsMaterial,
  FinishType,
  SSHardwareBrand,
  VisibilityType,
  PositionUsage,
  InstallationType,
  DesignCollection,
  ModularType,
  KitchenPriceRange,
} from './kitchenCabinetTypes'

export interface IKitchenCabinetUnit extends ICommonUnit {
  unitType?: KitchenUnitType;
  internalLayout?: InternalLayout;
  compartments?: Compartments;
  featureTags?: FeatureTags;
  dimensions?: Dimensions;
  carcassMaterial?: CarcassMaterial;
  doorsMaterial?: DoorsMaterial;
  finish?: FinishType;
  ssHardwareBrand?: SSHardwareBrand;
  visibilityType?: VisibilityType;
  positionUsage?: PositionUsage;
  installationType?: InstallationType;
  designCollection?: DesignCollection;
  modularType?: ModularType;
  priceRange?: KitchenPriceRange;
}




import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

const KitchenCabinetUnitSchema = new Schema<IKitchenCabinetUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, enum: Object.values(KitchenUnitType) },
    internalLayout: { type: String, enum: Object.values(InternalLayout) },
    compartments: { type: String, enum: Object.values(Compartments) },
    featureTags: { type: String, enum: Object.values(FeatureTags) },
    dimensions: { type: String, enum: Object.values(Dimensions) },
    carcassMaterial: { type: String, enum: Object.values(CarcassMaterial) },
    doorsMaterial: { type: String, enum: Object.values(DoorsMaterial) },
    finish: { type: String, enum: Object.values(FinishType) },
    ssHardwareBrand: { type: String, enum: Object.values(SSHardwareBrand) },
    visibilityType: { type: String, enum: Object.values(VisibilityType) },
    positionUsage: { type: String, enum: Object.values(PositionUsage) },
    installationType: { type: String, enum: Object.values(InstallationType) },
    designCollection: { type: String, enum: Object.values(DesignCollection) },
    modularType: { type: String, enum: Object.values(ModularType) },
    priceRange: { type: String, enum: Object.values(KitchenPriceRange) },
  },
  { timestamps: true }
);

export const KitchenCabinetUnitModel = model<IKitchenCabinetUnit>(
  "KitchenCabinetUnitModel",
  KitchenCabinetUnitSchema
);
