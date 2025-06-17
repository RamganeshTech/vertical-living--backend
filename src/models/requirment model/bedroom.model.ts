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
    min: 1,
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King"],
  },
  wardrobeIncluded: {
    type: Boolean,
    default: false,
  },
  falseCeilingRequired: {
    type: Boolean,
    default: false,
  },
  tvUnitRequired: {
    type: Boolean,
    default: false,
  },
  studyTableRequired: {
    type: Boolean,
    default: false,
  },
  bedroomPackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
  },
  notes: {
    type: String,
  },
},
{
    timestamps: true
}
);



