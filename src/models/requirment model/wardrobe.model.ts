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
    required: true,
  },
  lengthInFeet: {
    type: Number,
  },
  heightInFeet: {
    type: Number,
  },
  mirrorIncluded: {
    type: Boolean,
    default: false,
  },
  wardrobePackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
    required: true,
  },
  numberOfShelves: {
    type: Number,
    min: 0,
    default: null
  },
  numberOfDrawers: {
    type: Number,
    min: 0,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
}, {
    timestamps: true
});
