import { ICommonUnit } from "../All Unit Model/common.model";
import {
  TVUnitType,
  TVInternalLayout,
  TVCompartments,
  TVFeatureTags,
  TVDimensions,
  TVMaterialCarcass,
  TVMaterialFront,
  TVFinish,
  TVVisibilityType,
  TVPlacementType,
  TVInstallationType,
  TVModularType,
  TVPriceRange
} from "./TVUnitTypes"; // adjust path if needed

export interface ITVUnit extends ICommonUnit {
  unitType?: TVUnitType;
  internalLayout?: TVInternalLayout;
  compartments?: TVCompartments;
  featureTags?: TVFeatureTags;
  dimensions?: TVDimensions;
  materialCarcass?: TVMaterialCarcass;
  materialFront?: TVMaterialFront;
  finish?: TVFinish;
  visibilityType?: TVVisibilityType;
  tvPlacementType?: TVPlacementType;
  installationType?: TVInstallationType;
  modularType?: TVModularType;
  priceRange?: TVPriceRange; // price range string, flexible
}



import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

export const TVUnitSchema = new Schema<ITVUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, enum: Object.values(TVUnitType) },
    internalLayout: { type: String, enum: Object.values(TVInternalLayout) },
    compartments: { type: String, enum: Object.values(TVCompartments) },
    featureTags: { type: String, enum: Object.values(TVFeatureTags) },
    dimensions: { type: String, enum: Object.values(TVDimensions) },
    materialCarcass: { type: String, enum: Object.values(TVMaterialCarcass) },
    materialFront: { type: String, enum: Object.values(TVMaterialFront) },
    finish: { type: String, enum: Object.values(TVFinish) },
    visibilityType: { type: String, enum: Object.values(TVVisibilityType) },
    tvPlacementType: { type: String, enum: Object.values(TVPlacementType) },
    installationType: { type: String, enum: Object.values(TVInstallationType) },
    modularType: { type: String, enum: Object.values(TVModularType) },
    priceRange: { type: String },
  },
  { timestamps: true }
);

export const TVUnitModel = model("TVUnitModel", TVUnitSchema);
