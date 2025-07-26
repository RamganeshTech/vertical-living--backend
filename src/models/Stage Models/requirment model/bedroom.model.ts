import { Schema } from "mongoose";
import { Iupload, uploadSchema } from "./requirement.model";

export interface IBedroomRequirement {
  numberOfBedrooms: number;
  bedType?: "Single" | "Double" | "Queen" | "King";
  wardrobeIncluded?: boolean;
  falseCeilingRequired?: boolean;
  tvUnitRequired?: boolean;
  studyTableRequired?: boolean;
  bedroomPackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
  uploads: Iupload[]
  notes?: (string | null);
}

export const BedroomRequirementSchema = new Schema<IBedroomRequirement>({
  numberOfBedrooms: {
    type: Number,
    default: null
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King", null, ""],
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
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package", null, ""],
    default: null
  },
  uploads: { type: [uploadSchema], default: [] },
  notes: {
    type: String,
    default: null

  },
},
  {
    timestamps: true
  }
);



