// src/models/All Unit Model/bedCotUnit.model.ts

export enum BedSize {
  SINGLE = "Single",
  TWIN = "Twin",
  DOUBLE = "Double",
  QUEEN = "Queen",
  KING = "King",
  SUPER_KING = "Super King",
}

export enum BedLength {
  MM_1800 = "1800 mm",
  MM_1900 = "1900 mm",
  MM_2000 = "2000 mm",
  MM_2100 = "2100 mm",
}

export enum BedBreadth {
  MM_900 = "900 mm",
  MM_1200 = "1200 mm",
  MM_1500 = "1500 mm",
  MM_1800 = "1800 mm",
}

export enum HeadboardStyle {
  SIMPLE_PANEL = "Simple Panel",
  CUSHIONED = "Cushioned",
  TUFTED = "Tufted",
  WOODEN_CARVED = "Wooden Carved",
  STORAGE_ATTACHED = "Storage Attached",
  FLOATING = "Floating",
}

export enum StorageType {
  NO_STORAGE = "No Storage",
  BOX_STORAGE = "Box Storage",
  HYDRAULIC_LIFT = "Hydraulic Lift Storage",
  DRAWER_STORAGE = "Drawer Storage",
  SIDE_STORAGE = "Side Storage",
  HEADBOARD_STORAGE = "Headboard Storage",
}

export enum FrameMaterial {
  SOLID_WOOD = "Solid Wood",
  PLYWOOD_LAMINATE = "Plywood + Laminate",
  MDF = "MDF",
  HDHMR = "HDHMR",
  ENGINEERED_WOOD = "Engineered Wood",
}

export enum HeadboardMaterial {
  PLYWOOD = "Plywood",
  MDF = "MDF",
  UPHOLSTERED_FABRIC = "Upholstered Fabric",
  LEATHERETTE = "Leatherette",
  LAMINATE_PANEL = "Laminate Panel",
  WOOD = "Wood",
}

export enum FinishType {
  MATTE = "Matte",
  GLOSSY = "Glossy",
  WOOD_GRAIN = "Wood Grain",
  PU_FINISH = "PU Finish",
  VENEER = "Veneer",
  TEXTURED = "Textured",
}

export enum Edges {
  ROUNDED = "Rounded",
  SHARP = "Sharp",
}

export enum ModularType {
  FACTORY_MODULAR = "Factory Modular",
  CARPENTER_MADE = "Carpenter-Made",
}

export enum InstallationType {
  FLOOR_MOUNTED = "Floor Mounted",
  FOLDABLE = "Foldable",
  KNOCK_DOWN = "Knock-Down / Assembly Required",
}

export enum UsagePurpose {
  MASTER_BEDROOM = "Master Bedroom",
  GUEST_ROOM = "Guest Room",
  KIDS_ROOM = "Kids Room",
  RENTAL_HOME = "Rental Home",
  STUDIO = "Studio",
}

export enum BedCotPriceRange {
  RANGE_5K_10K = "₹5,000–₹10,000",
  RANGE_10K_25K = "₹10,000–₹25,000",
  RANGE_25K_50K = "₹25,000–₹50,000",
  RANGE_50K_PLUS = "₹50,000+",
}
