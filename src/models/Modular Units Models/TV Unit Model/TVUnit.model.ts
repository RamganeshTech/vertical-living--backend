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
  internalLayout?: TVInternalLayout;
  compartments?: TVCompartments;
  featureTags?: TVFeatureTags;
  dimensions?: TVDimensions;
  materialCarcass?: TVMaterialCarcass;
  materialFront?: TVMaterialFront;
  finish?: TVFinish;
  visibilityType?: TVVisibilityType;
  tvPlacementType?: TVPlacementType;
  installationType?: TVInstallationType;
  modularType?: TVModularType;
  // priceRange?: TVPriceRange; // price range string, flexible
}



import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

export const TVUnitSchema = new Schema<ITVUnit>(
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
    tvPlacementType: { type: String, default:"",  },
    installationType: { type: String, default:"",  },
    modularType: { type: String, default:"",  },
  },
  { timestamps: true }
);

export const TVUnitModel = model("TVUnitModel", TVUnitSchema);
