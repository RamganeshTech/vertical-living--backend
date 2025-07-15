import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

export interface IWardrobeUnit extends ICommonUnit {
  mirrorConfiguration: "With Mirror" | "Without Mirror" | "Partial Mirror" | "";
  doorType: "Swing (Hinged) Doors" | "Sliding Doors" | "Folding Doors" | "Open/Walk-in" | "";
  numberOfDoors: "Single Door" | "2-Door" | "3-Door" | "4-Door & Above" | "L-Shaped / Corner Units" | "";
  styleAesthetic:
    | "Modern Minimalist"
    | "Classic / Traditional"
    | "Contemporary Glossy"
    | "Rustic / Matte Wood"
    | "Industrial"
    | "";
  colorToneFinish:
    | "Dark Wood (Walnut/Wenge)"
    | "Light Wood (Oak/Maple)"
    | "White / Off-White"
    | "Color Pop (Blue, Green, etc.)"
    | "High-Gloss / Acrylic"
    | "Matte Finish"
    | "Glass / Lacquered Glass"
    | "";
  materialType:
    | "Plywood with Laminate"
    | "MDF or HDF with Acrylic"
    | "Particle Board"
    | "Solid Wood"
    | "Glass Panelled (Lacquered/Mirror)"
    | "";
  storageFunctionality:
    | "Hanging Space Only"
    | "Drawers + Hanging"
    | "Full Custom Interior"
    | "Loft Attached"
    | "Inbuilt Dresser"
    | "Integrated Study Table"
    | "";
  roomType:
    | "Master Bedroom Wardrobe"
    | "Kids' Room Wardrobe"
    | "Guest Bedroom Wardrobe"
    | "Studio/Compact Room"
    | "Walk-in Closet Setup"
    | "";
  layout:
    | "Straight Wall Wardrobe"
    | "L-Shaped"
    | "U-Shaped"
    | "Sliding with Dressing Unit"
    | "Wardrobe with TV Unit"
    | "";
  handleType:
    | "Handle-less / Push to Open"
    | "External Handles"
    | "Recessed Handles"
    | "Profile Handles (Aluminum)"
    | "";
}





import { Schema, model } from "mongoose";


const WardrobeUnitSchema = new Schema<IWardrobeUnit>(
  {
    ...CommonUnitsSchema,
    mirrorConfiguration: { type: String, default: "" },
    doorType: { type: String, default: "" },
    numberOfDoors: { type: String, default: "" },
    styleAesthetic: { type: String, default: "" },
    colorToneFinish: { type: String, default: "" },
    materialType: { type: String, default: "" },
    storageFunctionality: { type: String, default: "" },
    roomType: { type: String, default: "" },
    layout: { type: String, default: "" },
    handleType: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WardrobeUnitModel = model("WardrobeUnitModel", WardrobeUnitSchema);
