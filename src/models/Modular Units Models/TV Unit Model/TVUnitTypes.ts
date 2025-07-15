// 📌 TV Unit filters as enums

export enum TVUnitType {
  BASE_UNIT = "TV Base Unit",
  WALL_PANEL = "Wall-Mounted Panel",
  BACK_PANEL_STORAGE = "Back Panel with Storage",
  FULL_WALL_UNIT = "Full Wall Unit",
  FLOATING_UNIT = "Floating Unit",
}

export enum TVInternalLayout {
  SHELF_BASED = "Shelf-based",
  DRAWER_BASED = "Drawer-based",
  OPEN_DISPLAY = "Open Display",
  CLOSED_CABINET = "Closed Cabinet",
  TV_PANEL_ONLY = "TV Panel Only",
}

export enum TVCompartments {
  ONE_DOOR = "1 Door",
  TWO_DOORS = "2 Doors",
  THREE_PLUS_DOORS = "3+ Doors",
  ONE_TO_FOUR_DRAWERS = "1–4 Drawers",
  ONE_TO_FIVE_SHELVES = "1–5+ Shelves",
}

export enum TVFeatureTags {
  BACKLIT_PANEL = "Backlit Panel",
  HIDDEN_WIRING = "Hidden Wiring",
  SOUNDBAR_SHELF = "Soundbar Shelf",
  SET_TOP_BOX_SHELF = "Set-top Box Shelf",
  DECORATIVE_NICHE = "Decorative Niche",
  GLASS_DOOR_SECTION = "Glass Door Section",
}

export enum TVDimensions {
  WIDTH_1200 = "Width: 1200mm",
  WIDTH_1500 = "Width: 1500mm",
  WIDTH_1800 = "Width: 1800mm",
  WIDTH_2100 = "Width: 2100mm",
  WIDTH_2400_PLUS = "Width: 2400mm+",
  HEIGHT_450 = "Height: 450mm",
  HEIGHT_600 = "Height: 600mm",
  HEIGHT_900 = "Height: 900mm",
  HEIGHT_1200_PLUS = "Height: 1200mm+",
  DEPTH_300 = "Depth: 300mm",
  DEPTH_450 = "Depth: 450mm",
  DEPTH_600 = "Depth: 600mm",
}

export enum TVMaterialCarcass {
  BWP_PLYWOOD = "BWP Plywood",
  HDHMR = "HDHMR",
  MDF = "MDF",
  PARTICLE_BOARD = "Particle Board",
}

export enum TVMaterialFront {
  LAMINATE = "Laminate",
  ACRYLIC = "Acrylic",
  PU = "PU",
  MEMBRANE = "Membrane",
  GLASS = "Glass",
  ALUMINIUM_GLASS = "Aluminium + Glass",
}

export enum TVFinish {
  GLOSSY = "Glossy",
  MATTE = "Matte",
  TEXTURED = "Textured",
  WOOD_GRAIN = "Wood Grain",
  SUEDE = "Suede",
  LACQUERED_GLASS = "Lacquered Glass",
}

export enum TVVisibilityType {
  OPEN_SHELF = "Open Shelf",
  CLOSED_SHUTTER = "Closed Shutter",
  GLASS_SECTION = "Glass Section",
  HANDLE_LESS = "Handle-less",
}

export enum TVPlacementType {
  TABLETOP_STAND = "Tabletop Stand",
  WALL_MOUNTED = "Wall-Mounted",
  PANEL_MOUNT_SUPPORT = "Panel-Mount Support",
}

export enum TVInstallationType {
  FLOOR_MOUNTED = "Floor Mounted",
  WALL_MOUNTED = "Wall Mounted",
  HYBRID = "Hybrid",
  FREE_STANDING = "Free Standing",
}

export enum TVModularType {
  FACTORY_MODULAR = "Factory Modular",
  CARPENTER_MADE = "Carpenter-Made",
}

export enum TVPriceRange {
  RANGE_5K_10K = "₹5,000–₹10,000",
  RANGE_10K_25K = "₹10,000–₹25,000",
  RANGE_25K_50K = "₹25,000–₹50,000",
  RANGE_50K_PLUS = "₹50,000+",
}
