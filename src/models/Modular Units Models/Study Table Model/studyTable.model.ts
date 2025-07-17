import { ICommonUnit } from "../All Unit Model/common.model";
import {
  StudyTableUnitType,
  StudyTableLength,
  StudyTableBreadth,
  CarcassMaterial,
  TopSurfaceMaterial,
  FinishType,
  Lockers,
  LockerPosition,
  LockerOpeningType,
  StorageType,
  UsagePurpose,
  PriceRange,
} from "./studyTableTypes";
import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

export interface IStudyTableUnit extends ICommonUnit {
  unitType?: StudyTableUnitType;
  length?: StudyTableLength;
  breadth?: StudyTableBreadth;
  carcassMaterial?: CarcassMaterial;
  topSurfaceMaterial?: TopSurfaceMaterial;
  finish?: FinishType;
  lockers?: Lockers;
  lockerPosition?: LockerPosition;
  lockerOpeningType?: LockerOpeningType;
  storageType?: StorageType;
  usagePurpose?: UsagePurpose;
  // priceRange?: PriceRange;
}



const StudyTableUnitSchema = new Schema<IStudyTableUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, default:"",   },
    length: { type: String, default:"",   },
    breadth: { type: String, default:"",   },
    carcassMaterial: { type: String, default:"",   },
    topSurfaceMaterial: { type: String, default:"",   },
    finish: { type: String, default:"",   },
    lockers: { type: String, default:"",   },
    lockerPosition: { type: String, default:"",   },
    lockerOpeningType: { type: String, default:"",   },
    storageType: { type: String, default:"",   },
    usagePurpose: { type: String, default:"",   },
    // priceRange: { type: String, default:"",  enum: Object.values(PriceRange) },
  },
  { timestamps: true }
);

export const StudyTableUnitModel = model<IStudyTableUnit>(
  "StudyTableUnitModel",
  StudyTableUnitSchema
);