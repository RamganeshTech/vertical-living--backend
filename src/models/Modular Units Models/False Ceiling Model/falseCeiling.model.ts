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
 
  ceilingType?: CeilingType;
  lightingType?: LightingType;
  roomType?: RoomType;
  materialType?: MaterialType;
  designStyle?: DesignStyle;
  colorTheme?: ColorTheme;
  levels?: Levels;
  edgeProfile?: EdgeProfile;
  fixtureIntegration?: FixtureIntegration;
  panelType?: PanelType;
  shapeGeometry?: ShapeGeometry;
  modularType?: ModularType;
  installationComplexity?: InstallationComplexity;
  // budgetRange?: CeilingBudgetRange;


}




import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

const FalseCeilingUnitSchema = new Schema<IFalseCeilingUnit>(
  {
    ...CommonUnitsSchema.obj,


    ceilingType: { type: String, default: "" },
lightingType: { type:String, default: "" },
roomType: { type: String, default: "" },
materialType: { type: String, default: "" },
designStyle: { type: String, default: "" },
colorTheme: { type: String, default: "" },
levels: { type:String ,default: "" },
edgeProfile: { type:String , default: "" },
fixtureIntegration: { type: String, default: "" },
panelType: { type: String, default: "" },
shapeGeometry: { type: String, default: "" },
modularType: { type: String, default: "" },
installationComplexity: { type: String, default: "" }, //but presnt in the filters
    // budgetRange: { type: String, enum: Object.values(CeilingBudgetRange) },
  },
  { timestamps: true }
);

export const FalseCeilingUnitModel = model<IFalseCeilingUnit>(
  "FalseCeilingUnitModel",
  FalseCeilingUnitSchema
);
