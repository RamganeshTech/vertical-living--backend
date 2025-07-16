import { ICommonUnit } from "../All Unit Model/common.model";
import {
  BedSize,
  BedLength,
  BedBreadth,
  HeadboardStyle,
  StorageType,
  FrameMaterial,
  HeadboardMaterial,
  FinishType,
  Edges,
  ModularType,
  InstallationType,
  UsagePurpose,
  BedCotPriceRange,
} from "./BedCotTypes";

export interface IBedCotUnit extends ICommonUnit {
  bedSize?: BedSize;
  length?: BedLength;
  breadth?: BedBreadth;
  headboardStyle?: HeadboardStyle;
  storageType?: StorageType;
  frameMaterial?: FrameMaterial;
  headboardMaterial?: HeadboardMaterial;
  finish?: FinishType;
  edges?: Edges;
  modularType?: ModularType;
  installationType?: InstallationType;
  usagePurpose?: UsagePurpose;
  priceRange?: BedCotPriceRange;
}



import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";


const BedCotUnitSchema = new Schema<IBedCotUnit>(
  {
    ...CommonUnitsSchema.obj,

    bedSize: { type: String, enum: Object.values(BedSize) },
    length: { type: String, enum: Object.values(BedLength) },
    breadth: { type: String, enum: Object.values(BedBreadth) },
    headboardStyle: { type: String, enum: Object.values(HeadboardStyle) },
    storageType: { type: String, enum: Object.values(StorageType) },
    frameMaterial: { type: String, enum: Object.values(FrameMaterial) },
    headboardMaterial: { type: String, enum: Object.values(HeadboardMaterial) },
    finish: { type: String, enum: Object.values(FinishType) },
    edges: { type: String, enum: Object.values(Edges) },
    modularType: { type: String, enum: Object.values(ModularType) },
    installationType: { type: String, enum: Object.values(InstallationType) },
    usagePurpose: { type: String, enum: Object.values(UsagePurpose) },
    priceRange: { type: String, enum: Object.values(BedCotPriceRange) },
  },
  { timestamps: true }
);

export const BedCotUnitModel = model<IBedCotUnit>(
  "BedCotUnitModel",
  BedCotUnitSchema
);
