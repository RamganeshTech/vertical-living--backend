import { Schema } from "mongoose";

export interface ILivingHallRequirement {
  seatingStyle?: "Sofa Set" | "L-Shaped Sofa" | "Recliner Chairs" | "Floor Seating";
  tvUnitDesignRequired?: boolean;
  falseCeilingRequired?: boolean;
  wallDecorStyle?: "Paint" | "Wallpaper" | "Wood Paneling" | "Stone Cladding";
  numberOfFans?: (number | null);
  numberOfLights?: (number | null);
  livingHallPackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
  notes?: (string | null);
}


export const LivingHallRequirementSchema = new Schema<ILivingHallRequirement>({
  seatingStyle: {
    type: String,
    enum: ["Sofa Set", "L-Shaped Sofa", "Recliner Chairs", "Floor Seating", null, ""],
    default: null
  },
  tvUnitDesignRequired: {
    type: Boolean,
    default: null,
  },
  falseCeilingRequired: {
    type: Boolean,
    default: null,
  },
  wallDecorStyle: {
    type: String,
    enum: ["Paint", "Wallpaper", "Wood Paneling", "Stone Cladding", null, ""],
    default: null
  },
  numberOfFans: {
    type: Number,
    default: null

  },
  numberOfLights: {
    type: Number,
    default: null

  },
  livingHallPackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package", null, ""],
    default: null
  },
  notes: {
    type: String,
    default: null
  },
},
  {
    timestamps: true
  });
