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

    bedSize: { type: String,  },
    length: { type: String,  },
    breadth: { type: String,  },
    headboardStyle: { type: String,  },
    storageType: { type: String,  },
    frameMaterial: { type: String,  },
    headboardMaterial: { type: String,  },
    finish: { type: String,  },
    edges: { type: String,  },
    modularType: { type: String,  },
    installationType: { type: String,  },
    usagePurpose: { type: String,  },
    priceRange: { type: String,  },
  },
  { timestamps: true }
);

export const BedCotUnitModel = model<IBedCotUnit>(
  "BedCotUnitModel",
  BedCotUnitSchema
);
