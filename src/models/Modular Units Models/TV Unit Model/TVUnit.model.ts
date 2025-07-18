import { ICommonUnit } from "../All Unit Model/common.model";
import {
  TVUnitType,
  TVInternalLayout,
  TVCompartments,
  TVFeatureTags,
  TVDimensions,
  TVMaterialCarcass,
  TVMaterialFront,
  TVFinish,
  TVVisibilityType,
  TVPlacementType,
  TVInstallationType,
  TVModularType,
  TVPriceRange
} from "./TVUnitTypes"; // adjust path if needed

export interface ITVUnit extends ICommonUnit {
  unitType?: TVUnitType;
  // internalLayout?: TVInternalLayout;
  // compartments?: TVCompartments;
  // featureTags?: TVFeatureTags;
  // dimensions?: TVDimensions;
  panelMaterial?: TVMaterialCarcass;
  storageType?: "Open" | "Closed" | "Mixed",
  // materialFront?: TVMaterialFront;
  finish?: TVFinish;
  shutterType?: "Glass" | "Wooden" | "Aluminium-Framed",
  openShelves?: "Yes" | "No"
  lighting?: "Spotlights" | "Strip Lights" | "None"
  edges?: "Rounded" | "Sharp"
  // visibilityType?: TVVisibilityType;
  // tvPlacementType?: TVPlacementType;
  installationType?: TVInstallationType;
  modularType?: TVModularType;
  // priceRange?: TVPriceRange; // price range string, flexible
  addOns?: any[]; // Multiple add-ons possible

  height?: "2100 mm" | "2400 mm";
  breadth?: "450 mm" | "600 mm";
  length?: "1200 mm" | "1800 mm" | "2400 mm+";
}



import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

export const TVUnitSchema = new Schema<ITVUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, default: "", },
    // internalLayout: { type: String, default:"",  },
    // compartments: { type: String, default:"",  },
    // featureTags: { type: String, default:"",  },
    // dimensions: { type: String, default:"",  },
    panelMaterial: { type: String, default: "", },
    storageType: { type: String, default: "", },
    // materialFront: { type: String, default:"",  },
    finish: { type: String, default: "", },
    shutterType: { type: String, default: "" },
    openShelves: { type: String, default: "" },
    lighting: { type: String, default: "" },
    edges: { type: String, default: "" },
    // visibilityType: { type: String, default:"",  },
    // tvPlacementType: { type: String, default:"",  },
    installationType: { type: String, default: "", },
    modularType: { type: String, default: "", },
    addOns: { type: [String], default: [] },
    height: { type: String, default: "" },
    breadth: { type: String, default: "" },
    length: { type: String, default: "" },
  },
  { timestamps: true }
);

export const TVUnitModel = model("TVUnitModel", TVUnitSchema);
