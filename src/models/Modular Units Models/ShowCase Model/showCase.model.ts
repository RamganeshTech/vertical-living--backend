
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
  addOns?: ShowcaseAddons[]; // Multiple add-ons possible
  compartments?: ShowcaseCompartments;
  edges?: ShowcaseEdges;
  modularType?: ShowcaseModularType;
  // priceRange?: ShowcasePriceRange;
}

// 3️⃣ Schema

const ShowcaseUnitSchema = new Schema<IShowcaseUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, default: "", },
    length: { type: String, default: "", },
    breadth: { type: String, default: "", },
    carcassMaterial: { type: String, default: "", },
    frontMaterial: { type: String, default: "", },
    finish: { type: String, default: "", },
    storageType: { type: String, default: "", },
    shutterType: { type: String, default: "", },
    glassVisibility: { type: String, default: "", },
    lighting: { type: String, default: "", },
    installationType: { type: String, default: "", },
    usagePurpose: { type: String, default: "", },
    addOns: { type: [String], default: [] },
    compartments: { type: String, default: "", },
    edges: { type: String, default: "", },
    modularType: { type: String, default: "", },
    // priceRange: { type: String, default:"", enum: Object.values(ShowcasePriceRange) },
  },
  { timestamps: true }
);

// 4️⃣ Model

export const ShowcaseUnitModel = model<IShowcaseUnit>(
  "ShowcaseUnitModel",
  ShowcaseUnitSchema
);
