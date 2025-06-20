import { Schema } from "mongoose";

export interface IBedroomRequirement {
  numberOfBedrooms: number;
  bedType?: "Single" | "Double" | "Queen" | "King";
  wardrobeIncluded?: boolean;
  falseCeilingRequired?: boolean;
  tvUnitRequired?: boolean;
  studyTableRequired?: boolean;
  bedroomPackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
  notes?: (string | null);
}

export const BedroomRequirementSchema = new Schema<IBedroomRequirement>({
  numberOfBedrooms: {
    type: Number,
    default: null
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King"],
    default: null
  },
  wardrobeIncluded: {
    type: Boolean,
    default: null,
  },
  falseCeilingRequired: {
    type: Boolean,
    default: null,
  },
  tvUnitRequired: {
    type: Boolean,
    default: null,
  },
  studyTableRequired: {
    type: Boolean,
    default: null,
  },
  bedroomPackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
    default: null
  },
  notes: {
    type: String,
    default: null

  },
},
{
    timestamps: true
}
);



