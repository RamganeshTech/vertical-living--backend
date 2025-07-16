import { Schema, model } from "mongoose";
import { CommonUnitsSchema, ICommonUnit } from "../All Unit Model/common.model";

/** Enums for ShoeRack options */

export enum ShoeRackUnitType {
  ClosedCabinet = "Closed Cabinet",
  OpenShelf = "Open Shelf",
  SlantRack = "Slant Rack",
  BenchStyle = "Bench Style",
  WallMounted = "Wall-Mounted",
  DrawerType = "Drawer Type",
}

export enum ShoeRackCapacity {
  FourToSix = "4–6",
  SixToTen = "6–10",
  TenToFifteen = "10–15",
  FifteenToTwenty = "15–20",
  TwentyPlus = "20+",
}

export enum ShoeRackDoorType {
  OpenShelf = "Open Shelf",
  Shuttered = "Shuttered",
  Sliding = "Sliding",
  Flap = "Flap",
  Louvered = "Louvered",
  Mirrored = "Mirrored",
}

export enum CarcassMaterial {
  BWPPlywood = "BWP Plywood",
  HDHMR = "HDHMR",
  MDF = "MDF",
  ParticleBoard = "Particle Board",
}

export enum ShutterMaterial {
  Laminate = "Laminate",
  Acrylic = "Acrylic",
  PU = "PU",
  Membrane = "Membrane",
  Glass = "Glass",
  AluminiumGlass = "Aluminium + Glass",
}

export enum FinishType {
  Matte = "Matte",
  Glossy = "Glossy",
  Textured = "Textured",
  WoodGrain = "Wood Grain",
  DualTone = "Dual Tone",
}

export enum HeightCategory {
  Low = "Low Height (<600 mm)",
  Mid = "Mid Height (600–1200 mm)",
  Tall = "Tall (>1200 mm)",
}

export enum ShoeTypesSupported {
  Regular = "Regular",
  Sports = "Sports",
  Boots = "Boots",
  Heels = "Heels",
  Kids = "Kids",
}

export enum VentilationFeature {
  Yes = "Yes",
  No = "No",
}

export enum AddOnFeatures {
  SeatingBench = "Seating Bench",
  Mirror = "Mirror",
  StorageDrawer = "Storage Drawer",
  HangerHooks = "Hanger Hooks",
  CushionedTop = "Cushioned Top",
}

export enum PlacementArea {
  Entryway = "Entryway",
  Foyer = "Foyer",
  Bedroom = "Bedroom",
  UtilityArea = "Utility Area",
  Balcony = "Balcony",
}

export enum InstallationType {
  FloorMounted = "Floor Mounted",
  WallMounted = "Wall Mounted",
  FreeStanding = "Free Standing",
  Hybrid = "Hybrid",
}


export enum ShoeRackVisibilityType {
  Closed = "Closed",
  SemiOpen = "Semi-Open",
  Open = "Open",
}


export enum ShoeRackModularType {
  FactoryModular = "Factory Modular",
  CarpenterMade = "Carpenter-Made",
}


export enum BudgetRange {
  ThreeToSixK = "₹3,000–₹6,000",
  SixToTwelveK = "₹6,000–₹12,000",
  TwelveToEighteenK = "₹12,000–₹18,000",
  EighteenKPlus = "₹18,000+",
}
