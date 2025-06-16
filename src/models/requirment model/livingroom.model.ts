import { Schema } from "mongoose";

export interface ILivingHallRequirement {
  seatingStyle?: "Sofa Set" | "L-Shaped Sofa" | "Recliner Chairs" | "Floor Seating";
  tvUnitDesignRequired?: boolean;
  falseCeilingRequired?: boolean;
  wallDecorStyle?: "Paint" | "Wallpaper" | "Wood Paneling" | "Stone Cladding";
  numberOfFans?: number;
  numberOfLights?: number;
  livingHallPackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
  notes?: (string | null);
}


export const LivingHallRequirementSchema = new Schema<ILivingHallRequirement>({
  seatingStyle: {
    type: String,
    enum: ["Sofa Set", "L-Shaped Sofa", "Recliner Chairs", "Floor Seating"],
  },
  tvUnitDesignRequired: {
    type: Boolean,
    default: false,
  },
  falseCeilingRequired: {
    type: Boolean,
    default: false,
  },
  wallDecorStyle: {
    type: String,
    enum: ["Paint", "Wallpaper", "Wood Paneling", "Stone Cladding"],
  },
  numberOfFans: {
    type: Number,
    default: 1,
    min: 0,
  },
  numberOfLights: {
    type: Number,
    default: 1,
    min: 0,
  },
  livingHallPackage: {
    type: String,
    enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
    required: true,
  },
  notes: {
    type: String,
  },
}, 
{
    timestamps: true
});
