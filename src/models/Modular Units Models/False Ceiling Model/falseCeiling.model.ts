import { ICommonUnit } from "../All Unit Model/common.model";
import {
  CeilingType,
  LightingType,
  RoomType,
  MaterialType,
  DesignStyle,
  ColorTheme,
  Levels,
  EdgeProfile,
  FixtureIntegration,
  PanelType,
  ShapeGeometry,
  ModularType,
  InstallationComplexity,
  CeilingBudgetRange,
} from "./falseCeilingTypes";

export interface IFalseCeilingUnit extends ICommonUnit {
  ceilingType?: CeilingType[];
  lightingType?: LightingType[];
  roomType?: RoomType[];
  materialType?: MaterialType[];
  designStyle?: DesignStyle[];
  colorTheme?: ColorTheme[];
  levels?: Levels;
  edgeProfile?: EdgeProfile;
  fixtureIntegration?: FixtureIntegration[];
  panelType?: PanelType[];
  shapeGeometry?: ShapeGeometry;
  modularType?: ModularType;
  installationComplexity?: InstallationComplexity;
  budgetRange?: CeilingBudgetRange;
}




import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

const FalseCeilingUnitSchema = new Schema<IFalseCeilingUnit>(
  {
    ...CommonUnitsSchema.obj,

    ceilingType: [{ type: String, enum: Object.values(CeilingType) }],
    lightingType: [{ type: String, enum: Object.values(LightingType) }],
    roomType: [{ type: String, enum: Object.values(RoomType) }],
    materialType: [{ type: String, enum: Object.values(MaterialType) }],
    designStyle: [{ type: String, enum: Object.values(DesignStyle) }], //but presnt in the filters
    colorTheme: [{ type: String, enum: Object.values(ColorTheme) }],
    levels: { type: String, enum: Object.values(Levels) },
    edgeProfile: { type: String, enum: Object.values(EdgeProfile) },
    fixtureIntegration: [{ type: String, enum: Object.values(FixtureIntegration) }],
    panelType: [{ type: String, enum: Object.values(PanelType) }],
    shapeGeometry: { type: String, enum: Object.values(ShapeGeometry) },
    modularType: { type: String, enum: Object.values(ModularType) },
    installationComplexity: { type: String, enum: Object.values(InstallationComplexity) }, //but presnt in the filters
    budgetRange: { type: String, enum: Object.values(CeilingBudgetRange) },
  },
  { timestamps: true }
);

export const FalseCeilingUnitModel = model<IFalseCeilingUnit>(
  "FalseCeilingUnitModel",
  FalseCeilingUnitSchema
);
