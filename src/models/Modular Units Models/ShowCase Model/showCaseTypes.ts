// src/models/All Unit Model/showcaseUnit.model.ts

import { Schema, model } from "mongoose";
import { ICommonUnit, CommonUnitsSchema } from "../All Unit Model/common.model";

// 1️⃣ Enums for Showcase

export enum ShowcaseUnitType {
  WALL_MOUNTED = "Wall-Mounted",
  FREE_STANDING = "Free-Standing",
  FLOOR_TO_CEILING = "Floor-to-Ceiling",
  CORNER_SHOWCASE = "Corner Showcase",
  FLOATING_SHOWCASE = "Floating Showcase",
}

export enum ShowcaseLength {
  L600 = "600 mm",
  L900 = "900 mm",
  L1200 = "1200 mm",
  L1500 = "1500 mm",
  L1800 = "1800 mm",
  L2100_PLUS = "2100+ mm",
}

export enum ShowcaseBreadth {
  B300 = "300 mm",
  B450 = "450 mm",
  B600 = "600 mm",
}

export enum ShowcaseCarcassMaterial {
  BWP_PLYWOOD = "BWP Plywood",
  MDF = "MDF",
  HDHMR = "HDHMR",
  PARTICLE_BOARD = "Particle Board",
  ENGINEERED_WOOD = "Engineered Wood",
}

export enum ShowcaseFrontMaterial {
  LAMINATE = "Laminate",
  ACRYLIC = "Acrylic",
  PU = "PU",
  MEMBRANE = "Membrane",
  GLASS = "Glass",
  ALUMINIUM_GLASS = "Aluminium + Glass",
}

export enum ShowcaseFinish {
  GLOSSY = "Glossy",
  MATTE = "Matte",
  TEXTURED = "Textured",
  WOOD_GRAIN = "Wood Grain",
  VENEER = "Veneer",
  LACQUERED = "Lacquered",
}

export enum ShowcaseStorageType {
  OPEN_DISPLAY = "Open Display",
  CLOSED_SHUTTERS = "Closed Shutters",
  MIXED_STORAGE = "Mixed Storage",
}

export enum ShowcaseShutterType {
  GLASS = "Glass",
  WOODEN = "Wooden",
  ALUMINIUM_FRAMED_GLASS = "Aluminium-Framed Glass",
  MIRROR_FINISH = "Mirror Finish",
}

export enum ShowcaseGlassVisibility {
  CLEAR = "Clear",
  FROSTED = "Frosted",
  TINTED = "Tinted",
}

export enum ShowcaseLighting {
  SPOTLIGHTS = "Spotlights",
  STRIP_LIGHTS = "Strip Lights",
  WARM_BACKLIGHT = "Warm Backlight",
  NO_LIGHTING = "No Lighting",
}

export enum ShowcaseInstallationType {
  FLOOR_MOUNTED = "Floor Mounted",
  WALL_MOUNTED = "Wall Mounted",
  HYBRID = "Hybrid",
}

export enum ShowcaseUsagePurpose {
  LIVING_ROOM = "Living Room",
  DINING_AREA = "Dining Area",
  HALLWAY = "Hallway",
  COMMERCIAL_DISPLAY = "Commercial Display",
  PUJA_SHOWCASE = "Puja Showcase",
}

export enum ShowcaseAddons {
  MIRROR_BACK_PANEL = "Mirror Back Panel",
  DECORATIVE_HANDLES = "Decorative Handles",
  SOFT_CLOSE_HINGES = "Soft-Close Hinges",
  LOCKABLE_SECTIONS = "Lockable Sections",
}

export enum ShowcaseCompartments {
  ONE_DOOR = "1 Door",
  TWO_DOORS = "2 Doors",
  THREE_PLUS_DOORS = "3+ Doors",
  DRAWERS_1_4 = "1–4 Drawers",
  SHELVES_1_5_PLUS = "1–5+ Shelves",
}

export enum ShowcaseEdges {
  ROUNDED = "Rounded",
  SHARP = "Sharp",
}

export enum ShowcaseModularType {
  FACTORY_MODULAR = "Factory Modular",
  CARPENTER_MADE = "Carpenter-Made",
}

export enum ShowcasePriceRange {
  RANGE_5K_10K = "₹5,000–₹10,000",
  RANGE_10K_25K = "₹10,000–₹25,000",
  RANGE_25K_50K = "₹25,000–₹50,000",
  RANGE_50K_PLUS = "₹50,000+",
}
