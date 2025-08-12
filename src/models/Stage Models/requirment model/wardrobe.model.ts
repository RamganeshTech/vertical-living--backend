import { Schema } from "mongoose";
import { Iupload, uploadSchema } from "./mainRequirementNew.model";
// import { Iupload, uploadSchema } from "./requirement.model";

export interface IWardrobeRequirement {
  wardrobeType: "Sliding" | "Openable";
  lengthInFeet?: number;
  heightInFeet?: number;
  mirrorIncluded?: boolean;
  wardrobePackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";

//     affordablePricing?: boolean;
//     premiumDesigns?: boolean;
//     elitePricing?: boolean;
//     customDesign?: boolean;
//   };
  numberOfShelves?: (number | null);
  numberOfDrawers?: (number | null);
        uploads: Iupload[]
  notes?: (string | null);
}

export const WardrobeRequirementSchema = new Schema<IWardrobeRequirement>({
  wardrobeType: {
    type: String,
    enum: ["Sliding", "Openable", null, ""],
    default: null
  },
  lengthInFeet: {
    type: Number,
    default: null
  },
  heightInFeet: {
    type: Number,
    default: null
  },
  mirrorIncluded: {
    type: Boolean,
    default: null,
  },
  wardrobePackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package", null, ""],
    default: null
  },
  numberOfShelves: {
    type: Number,
    default: null
  },
  numberOfDrawers: {
    type: Number,
    default: null
  },
  uploads:{type : [uploadSchema], default:[]},
  notes: {
    type: String,
    default: null
  },
}, {
    timestamps: true
});
