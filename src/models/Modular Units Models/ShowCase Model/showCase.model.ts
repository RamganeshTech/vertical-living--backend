
// 2️⃣ Interface

import { model, Schema } from "mongoose";
import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";
import {
  ShowcaseUnitType,
  ShowcaseLength,
  ShowcaseBreadth,
  ShowcaseCarcassMaterial,
  ShowcaseFrontMaterial,
  ShowcaseFinish,
  ShowcaseStorageType,
  ShowcaseShutterType,
  ShowcaseGlassVisibility,
  ShowcaseLighting,
  ShowcaseInstallationType,
  ShowcaseUsagePurpose,
  ShowcaseAddons,
  ShowcaseCompartments,
  ShowcaseEdges,
  ShowcaseModularType,
  ShowcasePriceRange
} from "./showCaseTypes";

export interface IShowcaseUnit extends ICommonUnit {
  unitType?: ShowcaseUnitType;
  length?: ShowcaseLength;
  breadth?: ShowcaseBreadth;
  carcassMaterial?: ShowcaseCarcassMaterial;
  frontMaterial?: ShowcaseFrontMaterial;
  finish?: ShowcaseFinish;
  storageType?: ShowcaseStorageType;
  shutterType?: ShowcaseShutterType;
  glassVisibility?: ShowcaseGlassVisibility;
  lighting?: ShowcaseLighting;
  installationType?: ShowcaseInstallationType;
  usagePurpose?: ShowcaseUsagePurpose;
  addons?: ShowcaseAddons[]; // Multiple add-ons possible
  compartments?: ShowcaseCompartments;
  edges?: ShowcaseEdges;
  modularType?: ShowcaseModularType;
  priceRange?: ShowcasePriceRange;
}

// 3️⃣ Schema

const ShowcaseUnitSchema = new Schema<IShowcaseUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, enum: Object.values(ShowcaseUnitType) },
    length: { type: String, enum: Object.values(ShowcaseLength) },
    breadth: { type: String, enum: Object.values(ShowcaseBreadth) },
    carcassMaterial: { type: String, enum: Object.values(ShowcaseCarcassMaterial) },
    frontMaterial: { type: String, enum: Object.values(ShowcaseFrontMaterial) },
    finish: { type: String, enum: Object.values(ShowcaseFinish) },
    storageType: { type: String, enum: Object.values(ShowcaseStorageType) },
    shutterType: { type: String, enum: Object.values(ShowcaseShutterType) },
    glassVisibility: { type: String, enum: Object.values(ShowcaseGlassVisibility) },
    lighting: { type: String, enum: Object.values(ShowcaseLighting) },
    installationType: { type: String, enum: Object.values(ShowcaseInstallationType) },
    usagePurpose: { type: String, enum: Object.values(ShowcaseUsagePurpose) },
    addons: [{ type: String, enum: Object.values(ShowcaseAddons) }],
    compartments: { type: String, enum: Object.values(ShowcaseCompartments) },
    edges: { type: String, enum: Object.values(ShowcaseEdges) },
    modularType: { type: String, enum: Object.values(ShowcaseModularType) },
    priceRange: { type: String, enum: Object.values(ShowcasePriceRange) },
  },
  { timestamps: true }
);

// 4️⃣ Model

export const ShowcaseUnitModel = model<IShowcaseUnit>(
  "ShowcaseUnitModel",
  ShowcaseUnitSchema
);
