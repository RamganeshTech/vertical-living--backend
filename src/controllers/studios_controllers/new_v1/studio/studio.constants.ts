//  studio.constants.ts (backend)
/**
 * Studio module — shared constant lists.
 * Every enum used by the Mongoose schema and by request validation lives here,
 * so the frontend copy (frontend/studio/types/studioEnums.ts) can mirror it one to one.
 * All lengths in the Studio data model are millimetres.
 */

export const STUDIO_SCHEMA_VERSION = 1;

export const STUDIO_STATUSES = ["draft", "inReview", "sentToClient", "approved", "archived"] as const;

export const FLOOR_PLAN_FILE_TYPES = ["pdf", "image"] as const;

export const EXTRACTION_SOURCES = ["pdfText", "manual"] as const;

export const LENGTH_UNITS = ["millimetre", "feetInches", "metre"] as const;

export const ROOM_KINDS = [
  "kitchen",
  "bedroom",
  "kidsRoom",
  "living",
  "dining",
  "foyer",
  "study",
  "pooja",
  "utility",
  "bathroom",
  "balcony",
  "other",
] as const;

export const ROOM_LAYOUT_TEMPLATES = ["lShaped", "straight", "parallel", "twoWall", "oneWall", "empty"] as const;

export const WALL_LABELS = ["A", "B", "C", "D"] as const;

export const WALL_LAYER_TYPES = ["paint", "texturePaint", "wallpaper", "wallTiles", "flutedPanel", "woodPanelling"] as const;

export const WALLPAPER_PATTERNS = ["damask", "botanical", "geometric", "stripes"] as const;

export const FLOOR_FINISH_TYPES = [
  "existing",
  "vitrified",
  "glazedVitrified",
  "largeSlab",
  "antiSkid",
  "woodenLaminate",
  "spc",
  "marble",
  "granite",
] as const;

export const SKIRTING_MATERIALS = ["tile", "laminate", "stone", "none"] as const;

export const CEILING_TYPES = ["none", "flat", "peripheralCove", "floatingIslandCove"] as const;

export const OPENING_TYPES = ["door", "window", "slidingDoor", "ventilator", "openArch"] as const;

export const PLACEMENT_TYPES = ["wall", "freeStanding"] as const;

export const WALL_ROWS = ["lower", "upper"] as const;

export const SHUTTER_TYPES = ["standard", "glass", "open"] as const;

export const FURNITURE_PRICING_METHODS = ["computedFromPanels", "rateConfigurationItem"] as const;

export const LIGHT_TYPES = [
  "cobDownlight",
  "ledPanel",
  "pendant",
  "chandelier",
  "ceilingFanWithLight",
  "trackLight",
  "coveLedStrip",
  "wallLight",
  "floorLamp",
  "tableLamp",
] as const;

export const LIGHT_MOUNT_TYPES = ["ceiling", "wall", "floor", "table", "cove"] as const;

export const COLOUR_TEMPERATURES_KELVIN = [2700, 4000, 6500] as const;

export const ELECTRICAL_POINT_TYPES = [
  "switchboard4Module",
  "switchboard8Module",
  "switchboard12Module",
  "socket6Ampere",
  "socket16Ampere",
  "tvPoint",
  "acPoint",
  "geyserPoint",
  "exhaustFan",
  "lanPoint",
  "usbPoint",
] as const;

export const LIGHTING_MODES = ["day", "lightsOn", "night"] as const;

export const PRICE_UNITS = [
  "squareFoot",
  "runningFoot",
  "piece",
  "set",
  "pair",
  "sheet",
  "pack",
  "litre",
  "lumpSum",
] as const;

export const FLOOR_PLAN_IMPORT_MODES = ["replace", "append"] as const;

/** Where a studio's own rate came from: typed by the designer, picked from the Rate Configuration, or read from a price list. */
export const STUDIO_RATE_SOURCES = ["manual", "rateConfiguration", "priceList"] as const;

export const MAXIMUM_STUDIO_RATES = 2000;

/** Share links: how long they may last, and how many a studio keeps. */
export const MAXIMUM_SHARE_LINK_DAYS = 90;
export const MAXIMUM_SHARE_LINKS = 20;

/** Defaults applied when a studio is created. Percentages are editable per studio. */
export const DEFAULT_PRICING_SETTINGS = {
  labourPercentage: 12,
  installationPercentage: 8,
  marginPercentage: 30,
  gstPercentage: 18,
  /** Raise or lower the whole project (before GST); staff stay within the limits in Studio settings. */
  projectAdjustmentPercentage: 0,
} as const;

/** Roles that may change rates, percentages and price locks, and go beyond the staff adjustment limits (CEO = owner). */
export const PRICE_MANAGER_ROLES = ["owner", "CTO"] as const;

/** How far staff may raise or lower a project's price, unless Studio settings say otherwise. */
export const DEFAULT_STAFF_ADJUSTMENT_LIMITS = { minimumPercentage: -5, maximumPercentage: 10 } as const;

/** Bounds for anyone, so a typing slip cannot wipe out or multiply a quote. */
export const PROJECT_ADJUSTMENT_BOUNDS = { minimumPercentage: -50, maximumPercentage: 100 } as const;

export const DEFAULT_WALL_HEIGHT_MILLIMETRES = 3000;
export const DEFAULT_SHADOW_CASTING_LIGHT_LIMIT = 4;
export const SQUARE_FEET_PER_SQUARE_METRE = 10.7639;
export const MILLIMETRES_PER_FOOT = 304.8;
export const QUOTE_NUMBER_PREFIX = "STU";
export const MAXIMUM_QUOTE_NAME_LENGTH = 200;
export const MAXIMUM_LIST_PAGE_SIZE = 100;
