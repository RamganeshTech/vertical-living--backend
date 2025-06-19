import { Schema } from "mongoose";

export interface IWardrobeRequirement {
  wardrobeType: "Sliding" | "Openable";
  lengthInFeet?: number;
  heightInFeet?: number;
  mirrorIncluded?: boolean;
  wardrobePackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
//   packageDetails?: {
//     affordablePricing?: boolean;
//     premiumDesigns?: boolean;
//     elitePricing?: boolean;
//     customDesign?: boolean;
//   };
  numberOfShelves?: (number | null);
  numberOfDrawers?: (number | null);
  notes?: (string | null);
}

export const WardrobeRequirementSchema = new Schema<IWardrobeRequirement>({
  wardrobeType: {
    type: String,
    enum: ["Sliding", "Openable"],
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
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
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
  notes: {
    type: String,
    default: null
  },
}, {
    timestamps: true
});
