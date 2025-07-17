import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

import { CrockeryUnitType , CrockeryInternalLayout,
CrockeryCompartments,CrockeryFeatureTags,CrockeryDimensions,CrockeryMaterialCarcass,CrockeryMaterialFront,
CrockeryFinish,CrockeryVisibilityType,CrockeryPlacementLocation,CrockeryLightingType,CrockeryStorageType,
CrockeryInstallationType,CrockeryModularType,CrockeryGlassVisibility,CrockeryUsagePurpose,
CrockeryDoorOpeningStyle,CrockeryAddons} from "./crockeryUnitTypes";

import { Schema, model } from "mongoose";


export interface ICrockeryUnit extends ICommonUnit {
  unitType?: CrockeryUnitType;
  internalLayout?: CrockeryInternalLayout;
  compartments?: CrockeryCompartments;
  featureTags?: CrockeryFeatureTags;
  dimensions?: CrockeryDimensions;
  materialCarcass?: CrockeryMaterialCarcass;
  materialFront?: CrockeryMaterialFront;
  finish?: CrockeryFinish;
  visibilityType?: CrockeryVisibilityType;
  placementLocation?: CrockeryPlacementLocation;
  lightingType?: CrockeryLightingType;
  storageType?: CrockeryStorageType;
  installationType?: CrockeryInstallationType;
  modularType?: CrockeryModularType;
  // priceRange?: string; // keep simple string if price is dynamic
  glassVisibility?: CrockeryGlassVisibility;
  usagePurpose?: CrockeryUsagePurpose;
  doorOpeningStyle?: CrockeryDoorOpeningStyle;
  addons?: CrockeryAddons;
}





export const CrockeryUnitSchema = new Schema<ICrockeryUnit>(
  {
    ...CommonUnitsSchema.obj,
    unitType: { type: String, default:"",  },
    internalLayout: { type: String, default:"",  },
    compartments: { type: String, default:"",  },
    featureTags: { type: String, default:"",  },
    dimensions: { type: String, default:"",  },
    materialCarcass: { type: String, default:"",  },
    materialFront: { type: String, default:"",  },
    finish: { type: String, default:"",  },
    visibilityType: { type: String, default:"",  },
    placementLocation: { type: String, default:"",  },
    lightingType: { type: String, default:"",  },
    storageType: { type: String, default:"",  },
    installationType: { type: String, default:"",  },
    modularType: { type: String, default:"",  },
    glassVisibility: { type: String, default:"",  },
    usagePurpose: { type: String, default:"",  },
    doorOpeningStyle: { type: String, default:"",  },
    addons: { type: String, default:"",  },
    // priceRange: { type: String }, // optional: keep dynamic
  },
  { timestamps: true }
);

export const CrockeryUnitModel = model("CrockeryUnitModel", CrockeryUnitSchema);
