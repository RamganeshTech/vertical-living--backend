// src/models/All Unit Model/studyTableUnit.model.ts

export enum StudyTableUnitType {
  WALL_MOUNTED = "Wall-Mounted Table",
  FREE_STANDING = "Free-Standing Desk",
  FOLDABLE = "Foldable Study Table",
  TABLE_WITH_HUTCH = "Table with Hutch",
  L_SHAPED = "L-Shaped",
  U_SHAPED = "U-Shaped",
}

export enum StudyTableLength {
  LENGTH_600 = "600 mm",
  LENGTH_900 = "900 mm",
  LENGTH_1200 = "1200 mm",
  LENGTH_1500 = "1500 mm",
  LENGTH_1800 = "1800 mm",
}

export enum StudyTableBreadth {
  BREADTH_400 = "400 mm",
  BREADTH_450 = "450 mm",
  BREADTH_600 = "600 mm",
}

export enum CarcassMaterial {
  BWP_PLYWOOD = "BWP Plywood",
  HDHMR = "HDHMR",
  MDF = "MDF",
  PARTICLE_BOARD = "Particle Board",
}

export enum TopSurfaceMaterial {
  LAMINATE = "Laminate",
  ACRYLIC = "Acrylic",
  PU = "PU",
  MEMBRANE = "Membrane",
  WOOD_VENEER = "Wood Veneer",
  SOLID_WOOD_FINISH = "Solid Wood Finish",
}

export enum FinishType {
  MATTE = "Matte",
  GLOSSY = "Glossy",
  WOOD_GRAIN = "Wood Grain",
  TEXTURED = "Textured",
  SUEDE = "Suede",
}

export enum Lockers {
  NONE = "None",
  ONE = "1 Locker",
  TWO_PLUS = "2+ Lockers",
}

export enum LockerPosition {
  LEFT = "Left",
  RIGHT = "Right",
  CENTER = "Center",
  SIDE_HUTCH = "Side Hutch",
  OVERHEAD = "Overhead (Top)",
}

export enum LockerOpeningType {
  HINGED_DOOR = "Hinged Door",
  SLIDING_DOOR = "Sliding Door",
  TAMBOUR_SHUTTER = "Tambour Shutter",
  LIFT_UP = "Lift-Up",
}

export enum StorageType {
  OPEN_SHELVES = "Open Shelves",
  CLOSED_DRAWERS = "Closed Drawers",
  COMBINATION = "Combination",
  LOCKABLE_DRAWERS = "Lockable Drawers",
}

export enum UsagePurpose {
  KIDS_STUDY = "Kids Study",
  HOME_OFFICE = "Home Office",
  WORK_FROM_HOME = "Work From Home",
  READING_DESK = "Reading Desk",
  COMPACT_STUDY = "Compact Study",
}

export enum PriceRange {
  RANGE_3K_7_5K = "₹3,000–₹7,500",
  RANGE_7_5K_15K = "₹7,500–₹15,000",
  RANGE_15K_25K = "₹15,000–₹25,000",
  RANGE_25K_PLUS = "₹25,000+",
}
