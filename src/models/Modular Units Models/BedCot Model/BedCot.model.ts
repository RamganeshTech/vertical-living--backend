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
  // headboardStyle?: HeadboardStyle;
  storageType?: StorageType;
  frameMaterial?: FrameMaterial;
  headboardMaterial?: HeadboardMaterial;
  finish?: FinishType;
  edges?: Edges;
  modularType?: ModularType;
  installationType?: InstallationType;
  // usagePurpose?: UsagePurpose;
  bedType?:string,
  height?:string,
  addOns?:string[]
  // priceRange?: BedCotPriceRange;
}



import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";


const BedCotUnitSchema = new Schema<IBedCotUnit>(
  {
    ...CommonUnitsSchema.obj,

    bedSize: { type: String, default:"" },
    length: { type: String, default:"" },
    breadth: { type: String, default:"" },
    // headboardStyle: { type: String, default:"" },
    storageType: { type: String, default:"" },
    frameMaterial: { type: String, default:"" },
    headboardMaterial: { type: String, default:"" },
    finish: { type: String, default:"" },
    edges: { type: String, default:"" },
    modularType: { type: String, default:"" },
    installationType: { type: String, default:"" },
    // usagePurpose: { type: String, default:"" },
    // priceRange: { type: String, default:""  },
    bedType: { type: String, default: "" },
    height: { type: String, default: "" },
    addOns: { type: [String], default: [] },

  },
  { timestamps: true }
);

export const BedCotUnitModel = model<IBedCotUnit>(
  "BedCotUnitModel",
  BedCotUnitSchema
);
