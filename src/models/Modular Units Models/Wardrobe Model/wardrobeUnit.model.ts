import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

export interface IWardrobeUnit extends ICommonUnit {
  mirrorConfiguration?: "With Mirror" | "Without Mirror" | "Partial Mirror" | "";
  doorType?: "Swing (Hinged) Doors" | "Sliding Doors" | "Folding Doors" | "Open/Walk-in" | "";
  numberOfDoors?: "Single Door" | "2-Door" | "3-Door" | "4-Door & Above" | "L-Shaped / Corner Units" | "";
  styleAesthetic?:
    | "Modern Minimalist"
    | "Classic / Traditional"
    | "Contemporary Glossy"
    | "Rustic / Matte Wood"
    | "Industrial"
    | "";
  colorToneFinish?:
    | "Dark Wood (Walnut/Wenge)"
    | "Light Wood (Oak/Maple)"
    | "White / Off-White"
    | "Color Pop (Blue, Green, etc.)"
    | "High-Gloss / Acrylic"
    | "Matte Finish"
    | "Glass / Lacquered Glass"
    | "";
  materialType?:
    | "Plywood with Laminate"
    | "MDF or HDF with Acrylic"
    | "Particle Board"
    | "Solid Wood"
    | "Glass Panelled (Lacquered/Mirror)"
    | "";
  storageFunctionality?:
    | "Hanging Space Only"
    | "Drawers + Hanging"
    | "Full Custom Interior"
    | "Loft Attached"
    | "Inbuilt Dresser"
    | "Integrated Study Table"
    | "";
  roomType?:
    | "Master Bedroom Wardrobe"
    | "Kids' Room Wardrobe"
    | "Guest Bedroom Wardrobe"
    | "Studio/Compact Room"
    | "Walk-in Closet Setup"
    | "";
  layout?:
    | "Straight Wall Wardrobe"
    | "L-Shaped"
    | "U-Shaped"
    | "Sliding with Dressing Unit"
    | "Wardrobe with TV Unit"
    | "";
  handleType?:
    | "Handle-less / Push to Open"
    | "External Handles"
    | "Recessed Handles"
    | "Profile Handles (Aluminum)"
    | "";

   height?: "2100 mm" | "2400 mm";
  breadth?: "450 mm" | "600 mm";
  length?: "1200 mm" | "1800 mm" | "2400 mm+";
  carcassMaterial?: "Plywood" | "MDF";
  shutterMaterial?: "Laminate" | "Acrylic";
  finish?: "Matte" | "Glossy";
  internalAccessories?: "Pull-out Basket" | "Tie Rack";
  mirrorProvision?: "Yes" | "No";
  lighting?: "LED Strip" | "Spotlight";
  lockType?: "Central Lock" | "Individual Lock";
  edges?: "Rounded" | "Sharp";
  installationType?: "Floor Standing" | "Wall Mounted";
  modularType?: "Factory Modular" | "Carpenter-Made";
  wardrobeType?:"Sliding" | "Hinged" | "Walk-in"
}





import { Schema, model } from "mongoose";


const WardrobeUnitSchema = new Schema<IWardrobeUnit>(
  {
    ...CommonUnitsSchema.obj,
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
   
      // Fixed & Newly Added
    wardrobeType: { type: String, default: "" },
    height: { type: String, default: "" },
    breadth: { type: String, default: "" },
    length: { type: String, default: "" },
    carcassMaterial: { type: String, default: "" },
    shutterMaterial: { type: String, default: "" },
    finish: { type: String, default: "" },
    internalAccessories: { type: [String], default: [] },
    mirrorProvision: { type: String, default: "" },
    lighting: { type: String, default: "" },
    lockType: { type: String, default: "" },
    edges: { type: String, default: "" },
    installationType: { type: String, default: "" },
    modularType: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WardrobeUnitModel = model("WardrobeUnitModel", WardrobeUnitSchema);
