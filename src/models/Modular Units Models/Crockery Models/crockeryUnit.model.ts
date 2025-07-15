import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

import { CrockeryUnitType , CrockeryInternalLayout,
CrockeryCompartments,CrockeryFeatureTags,CrockeryDimensions,CrockeryMaterialCarcass,CrockeryMaterialFront,
CrockeryFinish,CrockeryVisibilityType,CrockeryPlacementLocation,CrockeryLightingType,CrockeryStorageType,
CrockeryInstallationType,CrockeryModularType,CrockeryGlassVisibility,CrockeryUsagePurpose,
CrockeryDoorOpeningStyle,CrockeryAddons} from "./crockeryUnitTypes";

import { Schema, model } from "mongoose";


export interface ICrockeryUnit extends ICommonUnit {
  unitType?: CrockeryUnitType;
  internalLayout?: CrockeryInternalLayout;
  compartments?: CrockeryCompartments;
  featureTags?: CrockeryFeatureTags;
  dimensions?: CrockeryDimensions;
  materialCarcass?: CrockeryMaterialCarcass;
  materialFront?: CrockeryMaterialFront;
  finish?: CrockeryFinish;
  visibilityType?: CrockeryVisibilityType;
  placementLocation?: CrockeryPlacementLocation;
  lightingType?: CrockeryLightingType;
  storageType?: CrockeryStorageType;
  installationType?: CrockeryInstallationType;
  modularType?: CrockeryModularType;
  priceRange?: string; // keep simple string if price is dynamic
  glassVisibility?: CrockeryGlassVisibility;
  usagePurpose?: CrockeryUsagePurpose;
  doorOpeningStyle?: CrockeryDoorOpeningStyle;
  addons?: CrockeryAddons;
}





export const CrockeryUnitSchema = new Schema<ICrockeryUnit>(
  {
    ...CommonUnitsSchema.obj,
    unitType: { type: String, enum: Object.values(CrockeryUnitType) },
    internalLayout: { type: String, enum: Object.values(CrockeryInternalLayout) },
    compartments: { type: String, enum: Object.values(CrockeryCompartments) },
    featureTags: { type: String, enum: Object.values(CrockeryFeatureTags) },
    dimensions: { type: String, enum: Object.values(CrockeryDimensions) },
    materialCarcass: { type: String, enum: Object.values(CrockeryMaterialCarcass) },
    materialFront: { type: String, enum: Object.values(CrockeryMaterialFront) },
    finish: { type: String, enum: Object.values(CrockeryFinish) },
    visibilityType: { type: String, enum: Object.values(CrockeryVisibilityType) },
    placementLocation: { type: String, enum: Object.values(CrockeryPlacementLocation) },
    lightingType: { type: String, enum: Object.values(CrockeryLightingType) },
    storageType: { type: String, enum: Object.values(CrockeryStorageType) },
    installationType: { type: String, enum: Object.values(CrockeryInstallationType) },
    modularType: { type: String, enum: Object.values(CrockeryModularType) },
    priceRange: { type: String }, // optional: keep dynamic
    glassVisibility: { type: String, enum: Object.values(CrockeryGlassVisibility) },
    usagePurpose: { type: String, enum: Object.values(CrockeryUsagePurpose) },
    doorOpeningStyle: { type: String, enum: Object.values(CrockeryDoorOpeningStyle) },
    addons: { type: String, enum: Object.values(CrockeryAddons) },
  },
  { timestamps: true }
);

export const CrockeryUnitModel = model("CrockeryUnitModel", CrockeryUnitSchema);
