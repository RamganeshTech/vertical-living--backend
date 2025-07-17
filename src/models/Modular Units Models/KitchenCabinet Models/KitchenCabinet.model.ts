import { ICommonUnit } from "../All Unit Model/common.model";
import {
  KitchenUnitType,
  InternalLayout,
  Compartments,
  FeatureTags,
  Dimensions,
  CarcassMaterial,
  DoorsMaterial,
  FinishType,
  SSHardwareBrand,
  VisibilityType,
  PositionUsage,
  InstallationType,
  DesignCollection,
  ModularType,
  KitchenPriceRange,
} from './kitchenCabinetTypes'

export interface IKitchenCabinetUnit extends ICommonUnit {
  unitType?: KitchenUnitType;
  internalLayout?: InternalLayout;
  compartments?: Compartments;
  featureTags?: FeatureTags;
  dimensions?: Dimensions;
  carcassMaterial?: CarcassMaterial;
  doorsMaterial?: DoorsMaterial;
  finish?: FinishType;
  ssHardwareBrand?: SSHardwareBrand;
  visibilityType?: VisibilityType;
  positionUsage?: PositionUsage;
  installationType?: InstallationType;
  designCollection?: DesignCollection;
  modularType?: ModularType;
  // priceRange?: KitchenPriceRange;
}




import { Schema, model } from "mongoose";
import { CommonUnitsSchema } from "../All Unit Model/common.model";

const KitchenCabinetUnitSchema = new Schema<IKitchenCabinetUnit>(
  {
    ...CommonUnitsSchema.obj,

    unitType: { type: String, default:"",  },
    internalLayout: { type: String, default:"",  },
    compartments: { type: String, default:"",  },
    featureTags: { type: String, default:"",  },
    dimensions: { type: String, default:"",  },
    carcassMaterial: { type: String, default:"",  },
    doorsMaterial: { type: String, default:"",  },
    finish: { type: String, default:"",  },
    ssHardwareBrand: { type: String, default:"",  },
    visibilityType: { type: String, default:"",  },
    positionUsage: { type: String, default:"",  },
    installationType: { type: String, default:"",  },
    designCollection: { type: String, default:"",  },
    modularType: { type: String, default:"",  },
    // priceRange: { type: String, default:"", enum: Object.values(KitchenPriceRange) },
  },
  { timestamps: true }
);

export const KitchenCabinetUnitModel = model<IKitchenCabinetUnit>(
  "KitchenCabinetUnitModel",
  KitchenCabinetUnitSchema
);
