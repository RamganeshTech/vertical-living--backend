
/** Final TypeScript interface */

import { model, Schema } from "mongoose";
import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

import {
  ShoeRackUnitType, ShoeRackCapacity, ShoeRackDoorType,
  CarcassMaterial, ShutterMaterial, FinishType, HeightCategory,
  ShoeTypesSupported, VentilationFeature, AddOnFeatures, PlacementArea,
  InstallationType, BudgetRange,
  ShoeRackVisibilityType,
  ShoeRackModularType
} from "./shoeRackTypes";

export interface IShoeRackUnit extends ICommonUnit {
  unitType?: ShoeRackUnitType;
  capacity?: ShoeRackCapacity;
  doorType?: ShoeRackDoorType;
  carcassMaterial?: CarcassMaterial;
  shutterMaterial?: ShutterMaterial;
  finish?: FinishType;
  heightCategory?: HeightCategory;
  shoeTypesSupported?: ShoeTypesSupported[];
  ventilationFeature?: VentilationFeature;
  visibilityType?: ShoeRackVisibilityType;
  modularType?: ShoeRackModularType;

  addOnFeatures?: AddOnFeatures[];
  placementArea?: PlacementArea[];
  installationType?: InstallationType;
  // budgetRange?: BudgetRange;
}

/** Mongoose Schema */

export const ShoeRackUnitSchema = new Schema<IShoeRackUnit>(
  {
    ...CommonUnitsSchema.obj,
    unitType: { type: String, default:"",   },
    capacity: { type: String, default:"",   },
    doorType: { type: String, default:"",   },
    carcassMaterial: { type: String, default:"",   },
    shutterMaterial: { type: String, default:"",   },
    finish: { type: String, default:"",   },
    heightCategory: { type: String, default:"",   },
    shoeTypesSupported: { type: [String], default:[]},
    ventilationFeature: { type: String, default:"",   },
    visibilityType: { type: String, default:"",   },
    modularType: { type: String, default:"",   },
    addOnFeatures: { type: [String], default:[] },
    placementArea: { type: [String], default:[] },
    installationType: { type: String, default:"",   },
    // budgetRange: { type: String,  },
  },
  { timestamps: true }
);

export const ShoeRackUnitModel = model<IShoeRackUnit>(
  "ShoeRackUnitModel",
  ShoeRackUnitSchema
);
