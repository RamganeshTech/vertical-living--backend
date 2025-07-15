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
  priceRange?: PriceRange;
}



const StudyTableUnitSchema = new Schema<IStudyTableUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, enum: Object.values(StudyTableUnitType) },
    length: { type: String, enum: Object.values(StudyTableLength) },
    breadth: { type: String, enum: Object.values(StudyTableBreadth) },
    carcassMaterial: { type: String, enum: Object.values(CarcassMaterial) },
    topSurfaceMaterial: { type: String, enum: Object.values(TopSurfaceMaterial) },
    finish: { type: String, enum: Object.values(FinishType) },
    lockers: { type: String, enum: Object.values(Lockers) },
    lockerPosition: { type: String, enum: Object.values(LockerPosition) },
    lockerOpeningType: { type: String, enum: Object.values(LockerOpeningType) },
    storageType: { type: String, enum: Object.values(StorageType) },
    usagePurpose: { type: String, enum: Object.values(UsagePurpose) },
    priceRange: { type: String, enum: Object.values(PriceRange) },
  },
  { timestamps: true }
);

export const StudyTableUnitModel = model<IStudyTableUnit>(
  "StudyTableUnit",
  StudyTableUnitSchema
);