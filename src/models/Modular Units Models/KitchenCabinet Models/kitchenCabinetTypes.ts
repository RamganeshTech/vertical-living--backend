// src/models/All Unit Model/kitchenCabinetUnit.model.ts

export enum KitchenUnitType {
  BASE_UNIT = "Base Unit",
  WALL_UNIT = "Wall Unit",
  MID_TALL_UNIT = "Mid-Tall Unit",
  TALL_UNIT = "Tall Unit",
}

export enum InternalLayout {
  SHELF_BASED = "Shelf-based",
  DRAWER_BASED = "Drawer-based",
  TANDEM_PULL_OUT = "Tandem Pull-out",
  LARDER = "Larder",
  OPEN_UNIT = "Open Unit",
  APPLIANCE_HOUSING = "Appliance Housing",
}

export enum Compartments {
  ONE_DOOR = "1 Door",
  TWO_DOORS = "2 Doors",
  THREE_PLUS_DOORS = "3+ Doors",
  DRAWERS_1_4 = "1–4 Drawers",
  SHELVES_1_5_PLUS = "1–5+ Shelves",
}

export enum FeatureTags {
  GAS_CYLINDER_UNIT = "Gas Cylinder Unit",
  MICROWAVE_SLOT = "Microwave Slot",
  OVEN_SLOT = "Oven Slot",
  PANTRY_PULL_OUT = "Pantry Pull-out",
  SINK_UNIT = "Sink Unit",
  HOB_UNIT = "Hob Unit",
}

export enum Dimensions {
  WIDTH_300_600 = "Width: 300-600mm",
  WIDTH_750_900 = "Width: 750-900mm",
  WIDTH_1200_PLUS = "Width: 1200mm+",
  HEIGHT_720_1200 = "Height: 720-1200mm",
  HEIGHT_2100_PLUS = "Height: 2100mm+",
  DEPTH_450_600 = "Depth: 450-600mm",
}

export enum CarcassMaterial {
  BWP_PLYWOOD = "BWP Plywood",
  BWR_PLYWOOD = "BWR Plywood",
  HDHMR = "HDHMR",
  MDF = "MDF",
  PARTICLE_BOARD = "Particle Board",
}

export enum DoorsMaterial {
  ACRYLIC = "Acrylic",
  MEMBRANE = "Membrane",
  PU = "PU",
  LAMINATE = "Laminate",
  GLASS = "Glass",
  ALUMINIUM_GLASS = "Aluminium + Glass",
}

export enum FinishType {
  GLOSSY = "Glossy",
  MATTE = "Matte",
  SUEDE = "Suede",
  TEXTURED = "Textured",
  GLASSY = "Glassy",
}

export enum SSHardwareBrand {
  HETTICH = "Hettich",
  HAFELE = "Hafele",
  BLUM = "Blum",
  EBCO = "Ebco",
  GODREJ = "Godrej",
  CUSTOM_LOCAL = "Custom/Local",
}

export enum VisibilityType {
  OPEN_SHELF = "Open Shelf",
  CLOSED_SHUTTER = "Closed Shutter",
  GLASS_FRONT = "Glass Front",
  HANDLE_LESS = "Handle-less",
}

export enum PositionUsage {
  UNDER_COUNTER = "Under-Counter (Base)",
  ABOVE_COUNTER = "Above Counter (Wall)",
  PANTRY_ZONE = "Pantry Zone (Tall)",
  APPLIANCE_SECTION = "Appliance Section",
}

export enum InstallationType {
  WALL_MOUNTED = "Wall Mounted",
  FLOOR_MOUNTED = "Floor Mounted",
  HYBRID = "Hybrid",
  FREE_STANDING = "Free Standing",
}

export enum DesignCollection {
  AARAMBH_PREMIUM = "Aarambh Premium",
  URBAN = "Urban",
  CLASSIC_MODULAR = "Classic Modular",
  CONTEMPORARY = "Contemporary",
  CUSTOM_TAILORED = "Custom Tailored",
}

export enum ModularType {
  FACTORY_MODULAR = "Factory Modular",
  CARPENTER_MADE = "Carpenter-Made",
}

export enum KitchenPriceRange {
  RANGE_5K_10K = "₹5,000–₹10,000",
  RANGE_10K_25K = "₹10,000–₹25,000",
  RANGE_25K_50K = "₹25,000–₹50,000",
  RANGE_50K_PLUS = "₹50,000+",
}
