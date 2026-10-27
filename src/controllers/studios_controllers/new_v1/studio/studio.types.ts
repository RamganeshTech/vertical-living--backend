
import type { Types } from "mongoose";
import type {
  CEILING_TYPES,
  COLOUR_TEMPERATURES_KELVIN,
  ELECTRICAL_POINT_TYPES,
  EXTRACTION_SOURCES,
  FLOOR_FINISH_TYPES,
  FLOOR_PLAN_FILE_TYPES,
  FLOOR_PLAN_IMPORT_MODES,
  FURNITURE_PRICING_METHODS,
  LENGTH_UNITS,
  LIGHT_MOUNT_TYPES,
  LIGHT_TYPES,
  LIGHTING_MODES,
  OPENING_TYPES,
  PLACEMENT_TYPES,
  PRICE_UNITS,
  ROOM_KINDS,
  ROOM_LAYOUT_TEMPLATES,
  SHUTTER_TYPES,
  SKIRTING_MATERIALS,
  STUDIO_RATE_SOURCES,
  STUDIO_STATUSES,
  WALL_LABELS,
  WALL_LAYER_TYPES,
  WALL_ROWS,
  WALLPAPER_PATTERNS,
} from "./studio.constants";

/* ------------------------------------------------------------------ */
/* Enum types                                                          */
/* ------------------------------------------------------------------ */

export type StudioStatus = (typeof STUDIO_STATUSES)[number];
export type FloorPlanFileType = (typeof FLOOR_PLAN_FILE_TYPES)[number];
export type ExtractionSource = (typeof EXTRACTION_SOURCES)[number];
export type LengthUnit = (typeof LENGTH_UNITS)[number];
export type RoomKind = (typeof ROOM_KINDS)[number];
export type RoomLayoutTemplate = (typeof ROOM_LAYOUT_TEMPLATES)[number];
export type WallLabel = (typeof WALL_LABELS)[number];
export type WallLayerType = (typeof WALL_LAYER_TYPES)[number];
export type WallpaperPattern = (typeof WALLPAPER_PATTERNS)[number];
export type FloorFinishType = (typeof FLOOR_FINISH_TYPES)[number];
export type SkirtingMaterial = (typeof SKIRTING_MATERIALS)[number];
export type CeilingType = (typeof CEILING_TYPES)[number];
export type OpeningType = (typeof OPENING_TYPES)[number];
export type PlacementType = (typeof PLACEMENT_TYPES)[number];
export type WallRow = (typeof WALL_ROWS)[number];
export type ShutterType = (typeof SHUTTER_TYPES)[number];
export type FurniturePricingMethod = (typeof FURNITURE_PRICING_METHODS)[number];
export type LightType = (typeof LIGHT_TYPES)[number];
export type LightMountType = (typeof LIGHT_MOUNT_TYPES)[number];
export type ColourTemperatureKelvin = (typeof COLOUR_TEMPERATURES_KELVIN)[number];
export type LightingMode = (typeof LIGHTING_MODES)[number];
export type PriceUnit = (typeof PRICE_UNITS)[number];
export type ElectricalPointType = (typeof ELECTRICAL_POINT_TYPES)[number];
export type FloorPlanImportMode = (typeof FLOOR_PLAN_IMPORT_MODES)[number];
export type StudioRateSource = (typeof STUDIO_RATE_SOURCES)[number];

/* ------------------------------------------------------------------ */
/* Shared field groups                                                 */
/* ------------------------------------------------------------------ */

/**
 * The price that was used for one priced element. Stored next to the element so a saved
 * quote never changes when the Rate Configuration library changes later.
 */
export interface PricedFields {
  rateConfigurationItemId: Types.ObjectId | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  quantity: number;
  unit: PriceUnit;
  labourCategoryName: string | null;
  labourRatePerSquareFoot: number;
  labourCost: number;
  totalPrice: number;
}

/** Area working for a wall layer, a floor or a ceiling. All areas in square feet. */
export interface AreaFields {
  grossAreaInSquareFeet: number;
  openingsAreaInSquareFeet: number;
  hiddenAreaInSquareFeet: number;
  netAreaInSquareFeet: number;
  wastagePercentage: number;
}

/** A material chosen for a role (carcass board, shutter finish, hinge and so on). */
export interface MaterialSelection {
  /** Finish or board kind, for example "acrylic", "woodVeneer", "bwpPlywood", "quartz", "barHandle". */
  materialType: string;
  colour: string;
  /** Brand and catalogue image of the chosen swatch (empty for built-in colours). */
  brandName: string;
  textureImageUrl: string;
  rateConfigurationItemId: Types.ObjectId | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  unit: PriceUnit;
}

/** One line of a price breakdown (for furniture and openings). */
export interface PriceBreakdownLine {
  _id: Types.ObjectId;
  label: string;
  /** The Studio rate this line was priced with (e.g. "carcass.bwpPlywood"); keeps the line's id from save to save. */
  rateKey: string;
  rateConfigurationItemId: Types.ObjectId | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  quantity: number;
  unit: PriceUnit;
  totalPrice: number;
}

/** Where an object sits: against a wall (position along it) or free in the room (room coordinates). */
export interface ObjectPlacement {
  placementType: PlacementType;
  wallLabel: WallLabel | null;
  wallRow: WallRow | null;
  positionAlongWall: number;
  positionX: number;
  positionZ: number;
  rotationDegrees: number;
}

/* ------------------------------------------------------------------ */
/* Floor plan and extraction                                           */
/* ------------------------------------------------------------------ */

export interface FloorPlanFile {
  _id: Types.ObjectId;
  fileType: FloorPlanFileType;
  url: string;
  originalName: string;
  pageNumber: number;
  uploadedAt: Date;
}

export interface ExtractionDetails {
  source: ExtractionSource;
  lengthUnit: LengthUnit;
  millimetresPerPixel: number;
  pageNumber: number;
  pageWidthInPixels: number;
  pageHeightInPixels: number;
  renderScale: number;
  detectedRoomCount: number;
  detectedOpeningCount: number;
  warnings: string[];
  extractedAt: Date | null;
}

export interface PlanBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/* Room parts                                                          */
/* ------------------------------------------------------------------ */

export interface WallLayer extends PricedFields, AreaFields {
  _id: Types.ObjectId;
  layerType: WallLayerType;
  colour: string;
  wallpaperPattern: WallpaperPattern | null;
  tileWidth: number;
  tileHeight: number;
  boxCoverageInSquareFeet: number;
  tilePiecesToOrder: number;
  tileBoxesToOrder: number;
  startHeight: number;
  endHeight: number;
}

export interface Wall {
  _id: Types.ObjectId;
  label: WallLabel;
  length: number;
  height: number;
  layers: WallLayer[];
}

export interface Opening extends PricedFields {
  _id: Types.ObjectId;
  code: string;
  wallLabel: WallLabel;
  openingType: OpeningType;
  positionAlongWall: number;
  width: number;
  height: number;
  sillHeight: number;
  productType: string;
  frameColour: string;
  hasMosquitoMesh: boolean;
  hasGrill: boolean;
  isIncludedInQuote: boolean;
  priceBreakdown: PriceBreakdownLine[];
}

export interface Skirting extends PricedFields {
  material: SkirtingMaterial;
  skirtingHeight: number;
  lengthInRunningFeet: number;
}

export interface FloorFinish extends PricedFields, AreaFields {
  finishType: FloorFinishType;
  colour: string;
  tileWidth: number;
  tileHeight: number;
  boxCoverageInSquareFeet: number;
  tilePiecesToOrder: number;
  tileBoxesToOrder: number;
  skirting: Skirting;
}

export interface CoveLight extends PricedFields {
  lengthInRunningFeet: number;
}

export interface CeilingFinish extends PricedFields, AreaFields {
  ceilingType: CeilingType;
  levelFromFloor: number;
  bandWidth: number;
  colour: string;
  flatAreaInSquareFeet: number;
  dropAreaInSquareFeet: number;
  hasCoveLight: boolean;
  coveLight: CoveLight;
}

export interface FurnitureAccessory extends PricedFields {
  _id: Types.ObjectId;
  accessoryType: string;
  label: string;
}

export interface FurnitureMaterials {
  carcassBoard: MaterialSelection;
  backPanel: MaterialSelection;
  shutterFinish: MaterialSelection;
  edgeBanding: MaterialSelection;
  countertop: MaterialSelection;
  hinge: MaterialSelection;
  drawerChannel: MaterialSelection;
  handle: MaterialSelection;
  hangingRod: MaterialSelection;
}

export interface FurnitureItem extends PricedFields {
  _id: Types.ObjectId;
  code: string;
  furnitureType: string;
  placement: ObjectPlacement;
  width: number;
  height: number;
  depth: number;
  heightFromFloor: number;
  headboardHeight: number;
  shutterType: ShutterType;
  shelfCount: number;
  drawerCount: number;
  hasHangingRod: boolean;
  hasHydraulicLift: boolean;
  hasUpholsteredHeadboard: boolean;
  isCustomSize: boolean;
  shutterFinishOverride: MaterialSelection | null;
  accessories: FurnitureAccessory[];
  materialOverrides?: FurnitureMaterials | null;

  pricingMethod: FurniturePricingMethod;
  priceBreakdown: PriceBreakdownLine[];
  materialCost: number;
  labourCost: number;
  installationCost: number;
  marginAmount: number;
}

export interface DecorItem extends PricedFields {
  _id: Types.ObjectId;
  decorType: string;
  label: string;
  placement: ObjectPlacement;
  width: number;
  height: number;
  depth: number;
  heightFromFloor: number;
  colour: string;
  modelUrl: string;
  imageUrl: string;
  isIncludedInQuote: boolean;
}

export interface LightWiring {
  rateConfigurationItemId: Types.ObjectId | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  quantity: number;
  unit: PriceUnit;
  totalPrice: number;
}

export interface StudioLight extends PricedFields {
  _id: Types.ObjectId;
  lightType: LightType;
  mountType: LightMountType;
  wattage: number;
  colourTemperature: ColourTemperatureKelvin;
  brightnessPercentage: number;
  beamAngleDegrees: number;
  isSwitchedOn: boolean;
  placement: ObjectPlacement;
  height: number;
  lengthInRunningFeet: number;
  isIncludedInQuote: boolean;
  wiring: LightWiring;
}

export interface ElectricalPoint extends PricedFields {
  _id: Types.ObjectId;
  pointType: ElectricalPointType;
  wallLabel: WallLabel;
  positionAlongWall: number;
  heightFromFloor: number;
  isIncludedInQuote: boolean;
}

export interface RoomPricing {
  furnitureTotal: number;
  wallsTotal: number;
  floorTotal: number;
  ceilingTotal: number;
  openingsTotal: number;
  lightingTotal: number;
  electricalTotal: number;
  decorTotal: number;
  subtotal: number;
}

export interface Room {
  _id: Types.ObjectId;
  name: string;
  roomKind: RoomKind;
  layoutTemplate: RoomLayoutTemplate;
  width: number;
  depth: number;
  wallHeight: number;
  floorPlanPositionX: number;
  floorPlanPositionY: number;
  planBox: PlanBox | null;
  isManuallyDrawn: boolean;
  lightingMode: LightingMode;
  furnitureMaterials: FurnitureMaterials;
  walls: Wall[];
  openings: Opening[];
  floor: FloorFinish;
  ceiling: CeilingFinish;
  furniture: FurnitureItem[];
  decorItems: DecorItem[];
  lights: StudioLight[];
  electricalPoints: ElectricalPoint[];
  pricing: RoomPricing;
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

export interface PricingSettings {
  labourPercentage: number;
  installationPercentage: number;
  marginPercentage: number;
  gstPercentage: number;
  /** + raises, − lowers the whole project before GST. */
  projectAdjustmentPercentage: number;
}

export interface StudioTotals {
  /** Sum of the rooms. */
  subtotal: number;
  /** subtotal × projectAdjustmentPercentage (negative for a discount). */
  adjustmentAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export interface ViewerSettings {
  shadowCastingLightLimit: number;
  defaultLightingMode: LightingMode;
}

export interface ImportOptions {
  addOpenings: boolean;
  addSuggestedFurniture: boolean;
}

/** A rate this studio uses instead of the organisation's Rate Configuration (or the sample rate). */
export interface StudioRate {
  _id: Types.ObjectId;
  rateKey: string;
  rateConfigurationItemId: Types.ObjectId | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  unit: PriceUnit;
  source: StudioRateSource;
}

/** While locked, the saved unit prices of existing lines and the percentages cannot change; quantities still follow the design. */
export interface PriceLock {
  isLocked: boolean;
  lockedAt: Date | null;
  lockedBy: Types.ObjectId | null;
}

export interface PriceListFile {
  _id: Types.ObjectId;
  url: string;
  originalName: string;
  rowCount: number;
  appliedRateCount: number;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId | null;
}

/** A link that shows the studio in a read-only 3D and 360° viewer, without signing in. */
export interface ShareLink {
  _id: Types.ObjectId;
  token: string;
  showsPrices: boolean;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdBy: Types.ObjectId | null;
  viewCount: number;
}

export interface ClientDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
}

export interface PaymentStage {
  label: string;
  percentage: number;
}

/** What the quotation prints for this client. With usesOrganisationDefaults, terms and schedule come from Studio settings. */
export interface QuotationDetails {
  client: ClientDetails;
  usesOrganisationDefaults: boolean;
  terms: string[];
  paymentSchedule: PaymentStage[];
  validityDays: number;
  notes: string;
}

export interface CompanyDetails {
  companyName: string;
  tagline: string;
  addressLines: string[];
  phone: string;
  email: string;
  website: string;
  gstin: string;
  logoUrl: string;
  bankDetails: string[];
}

/** One per organisation: letterhead, quotation defaults, default percentages, staff limits, factory choices. */
export interface StudioSettings {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  company: CompanyDetails;
  quotationDefaults: { terms: string[]; paymentSchedule: PaymentStage[]; validityDays: number; notes: string };
  pricingDefaults: PricingSettings;
  staffAdjustmentLimits: { minimumPercentage: number; maximumPercentage: number };
  production: { inHouseShutterFinishes: string[] };
  updatedBy: Types.ObjectId | null;
  updatedAt: Date;
}

export interface EditLock {
  userId: Types.ObjectId | null;
  expiresAt: Date | null;
}

export interface IStudio {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  projectId: Types.ObjectId | null;
  quoteNo: string;
  quoteName: string;
  status: StudioStatus;
  schemaVersion: number;
  version: number;
  currency: string;
  floorPlan: FloorPlanFile | null;
  extraction: ExtractionDetails;
  importOptions: ImportOptions;
  pricingSettings: PricingSettings;
  studioRates: StudioRate[];
  priceLock: PriceLock;
  priceLists: PriceListFile[];
  shareLinks: ShareLink[];
  quotationDetails: QuotationDetails;
  viewerSettings: ViewerSettings;
  rooms: Room[];
  totals: StudioTotals;
  lock: EditLock;
  createdBy: Types.ObjectId | null;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Request and response shapes                                         */
/* ------------------------------------------------------------------ */

export interface ApiSuccessResponse<ResponseData> {
  ok: true;
  message: string;
  data: ResponseData;
}

export interface ApiErrorResponse {
  ok: false;
  message: string;
  errors?: string[];
}

export interface StudioListItem {
  _id: Types.ObjectId;
  quoteNo: string;
  quoteName: string;
  status: StudioStatus;
  projectId: Types.ObjectId | null;
  projectName: string;
  roomCount: number;
  grandTotal: number;
  hasFloorPlan: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudioListResult {
  items: StudioListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
