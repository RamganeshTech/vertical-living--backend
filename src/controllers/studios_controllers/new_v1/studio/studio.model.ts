import mongoose, { Schema } from "mongoose";
import {
  CEILING_TYPES,
  COLOUR_TEMPERATURES_KELVIN,
  DEFAULT_PRICING_SETTINGS,
  DEFAULT_STAFF_ADJUSTMENT_LIMITS,
  PROJECT_ADJUSTMENT_BOUNDS,
  DEFAULT_SHADOW_CASTING_LIGHT_LIMIT,
  DEFAULT_WALL_HEIGHT_MILLIMETRES,
  ELECTRICAL_POINT_TYPES,
  EXTRACTION_SOURCES,
  FLOOR_FINISH_TYPES,
  FLOOR_PLAN_FILE_TYPES,
  FURNITURE_PRICING_METHODS,
  LENGTH_UNITS,
  LIGHT_MOUNT_TYPES,
  LIGHT_TYPES,
  LIGHTING_MODES,
  MAXIMUM_QUOTE_NAME_LENGTH,
  OPENING_TYPES,
  PLACEMENT_TYPES,
  PRICE_UNITS,
  QUOTE_NUMBER_PREFIX,
  ROOM_KINDS,
  ROOM_LAYOUT_TEMPLATES,
  SHUTTER_TYPES,
  SKIRTING_MATERIALS,
  STUDIO_RATE_SOURCES,
  STUDIO_SCHEMA_VERSION,
  STUDIO_STATUSES,
  WALL_LABELS,
  WALL_LAYER_TYPES,
  WALL_ROWS,
  WALLPAPER_PATTERNS,
} from "./studio.constants";
import type {
  CeilingFinish,
  CoveLight,
  DecorItem,
  ElectricalPoint,
  ExtractionDetails,
  FloorFinish,
  FloorPlanFile,
  FurnitureAccessory,
  FurnitureItem,
  FurnitureMaterials,
  IStudio,
  LightWiring,
  MaterialSelection,
  ObjectPlacement,
  Opening,
  PlanBox,
  PriceBreakdownLine,
  ClientDetails,
  CompanyDetails,
  PaymentStage,
  PriceListFile,
  QuotationDetails,
  ShareLink,
  StudioSettings,
  Room,
  RoomPricing,
  Skirting,
  StudioLight,
  StudioRate,
  Wall,
  WallLayer,
} from "./studio.types";

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */

/** Array sub-documents: the backend generates every _id. */
const withId = { _id: true } as const;
/** Single nested objects (not in arrays) do not need their own _id. */
const withoutId = { _id: false } as const;

const enumField = <AllowedValue extends string>(allowedValues: readonly AllowedValue[], defaultValue: AllowedValue) => ({
  type: String,
  enum: [...allowedValues],
  default: defaultValue,
});
const requiredEnumField = <AllowedValue extends string>(allowedValues: readonly AllowedValue[]) => ({
  type: String,
  enum: [...allowedValues],
  required: true,
});
const nullableEnumField = <AllowedValue extends string>(allowedValues: readonly AllowedValue[]) => ({
  type: String,
  enum: [...allowedValues, null],
  default: null,
});
const numberEnumField = <AllowedValue extends number>(allowedValues: readonly AllowedValue[], defaultValue: AllowedValue) => ({
  type: Number,
  enum: [...allowedValues],
  default: defaultValue,
});
const nonNegativeNumber = (defaultValue: number) => ({ type: Number, min: 0, default: defaultValue });
/** Coordinates and positions: any value is accepted so plans of any size reload exactly. */
const anyNumber = (defaultValue: number) => ({ type: Number, default: defaultValue });
const trimmedString = (defaultValue: string, maximumLength = 200) => ({
  type: String,
  trim: true,
  maxlength: maximumLength,
  default: defaultValue,
});
const colourString = (defaultValue: string) => ({
  type: String,
  trim: true,
  match: /^#[0-9a-fA-F]{6}$/,
  default: defaultValue,
});

const pricedDefinition = {
  rateConfigurationItemId: { type: Schema.Types.ObjectId, ref: "RateConfigurationModel", default: null },
  rateConfigurationItemName: trimmedString(""),
  unitPrice: nonNegativeNumber(0),
  quantity: nonNegativeNumber(0),
  unit: enumField(PRICE_UNITS, "piece"),
  totalPrice: nonNegativeNumber(0),
  usesMaterialItem: { type: Boolean, default: false },
  labourCategoryName: { type: String, default: null },
  labourRatePerSquareFoot: nonNegativeNumber(0),
  labourCost: nonNegativeNumber(0),
};

const areaDefinition = {
  grossAreaInSquareFeet: nonNegativeNumber(0),
  openingsAreaInSquareFeet: nonNegativeNumber(0),
  hiddenAreaInSquareFeet: nonNegativeNumber(0),
  netAreaInSquareFeet: nonNegativeNumber(0),
  wastagePercentage: { type: Number, min: 0, max: 100, default: 0 },
};

/* ------------------------------------------------------------------ */
/* Small shared sub-schemas                                            */
/* ------------------------------------------------------------------ */

const MaterialSelectionSchema = new Schema<MaterialSelection>(
  {
    materialType: trimmedString("", 100),
    colour: { type: String, trim: true, default: "" },
    brandName: trimmedString("", 200),
    textureImageUrl: { type: String, trim: true, default: "", maxlength: 2000 },
    rateConfigurationItemId: { type: Schema.Types.ObjectId, ref: "RateConfigurationModel", default: null },
    rateConfigurationItemName: trimmedString(""),
    unitPrice: nonNegativeNumber(0),
    unit: enumField(PRICE_UNITS, "squareFoot"),
  },
  withoutId
);

const PriceBreakdownLineSchema = new Schema<PriceBreakdownLine>(
  {
    label: trimmedString("", 300),
    rateKey: trimmedString("", 100),
    rateConfigurationItemId: { type: Schema.Types.ObjectId, ref: "RateConfigurationModel", default: null },
    rateConfigurationItemName: trimmedString(""),
    unitPrice: nonNegativeNumber(0),
    quantity: nonNegativeNumber(0),
    unit: enumField(PRICE_UNITS, "piece"),
    totalPrice: nonNegativeNumber(0),
  },
  withId
);

const ObjectPlacementSchema = new Schema<ObjectPlacement>(
  {
    placementType: enumField(PLACEMENT_TYPES, "wall"),
    wallLabel: nullableEnumField(WALL_LABELS),
    wallRow: nullableEnumField(WALL_ROWS),
    positionAlongWall: anyNumber(0),
    positionX: anyNumber(0),
    positionZ: anyNumber(0),
    rotationDegrees: anyNumber(0),
  },
  withoutId
);

const PlanBoxSchema = new Schema<PlanBox>(
  {
    left: anyNumber(0),
    top: anyNumber(0),
    width: nonNegativeNumber(0),
    height: nonNegativeNumber(0),
  },
  withoutId
);

/* ------------------------------------------------------------------ */
/* Walls, openings, floor and ceiling                                  */
/* ------------------------------------------------------------------ */

const WallLayerSchema = new Schema<WallLayer>(
  {
    layerType: requiredEnumField(WALL_LAYER_TYPES),
    colour: colourString("#F1ECE2"),
    wallpaperPattern: nullableEnumField(WALLPAPER_PATTERNS),
    tileWidth: nonNegativeNumber(0),
    tileHeight: nonNegativeNumber(0),
    boxCoverageInSquareFeet: nonNegativeNumber(0),
    tilePiecesToOrder: nonNegativeNumber(0),
    tileBoxesToOrder: nonNegativeNumber(0),
    startHeight: nonNegativeNumber(0),
    endHeight: nonNegativeNumber(0),
    ...areaDefinition,
    ...pricedDefinition,
  },
  withId
);

const WallSchema = new Schema<Wall>(
  {
    label: requiredEnumField(WALL_LABELS),
    length: nonNegativeNumber(0),
    height: nonNegativeNumber(DEFAULT_WALL_HEIGHT_MILLIMETRES),
    layers: { type: [WallLayerSchema], default: [] },
  },
  withId
);

const OpeningSchema = new Schema<Opening>(
  {
    code: trimmedString("", 20),
    wallLabel: requiredEnumField(WALL_LABELS),
    openingType: requiredEnumField(OPENING_TYPES),
    positionAlongWall: anyNumber(0),
    width: nonNegativeNumber(900),
    height: nonNegativeNumber(2100),
    sillHeight: nonNegativeNumber(0),
    productType: trimmedString("byBuilder", 100),
    frameColour: colourString("#6B4429"),
    hasMosquitoMesh: { type: Boolean, default: false },
    hasGrill: { type: Boolean, default: false },
    isIncludedInQuote: { type: Boolean, default: false },
    priceBreakdown: { type: [PriceBreakdownLineSchema], default: [] },
    ...pricedDefinition,
  },
  withId
);

const SkirtingSchema = new Schema<Skirting>(
  {
    material: enumField(SKIRTING_MATERIALS, "none"),
    skirtingHeight: nonNegativeNumber(100),
    lengthInRunningFeet: nonNegativeNumber(0),
    ...pricedDefinition,
  },
  withoutId
);

const FloorFinishSchema = new Schema<FloorFinish>(
  {
    finishType: enumField(FLOOR_FINISH_TYPES, "existing"),
    colour: colourString("#ECE8E1"),
    tileWidth: nonNegativeNumber(0),
    tileHeight: nonNegativeNumber(0),
    boxCoverageInSquareFeet: nonNegativeNumber(0),
    tilePiecesToOrder: nonNegativeNumber(0),
    tileBoxesToOrder: nonNegativeNumber(0),
    skirting: { type: SkirtingSchema, default: () => ({}) },
    ...areaDefinition,
    ...pricedDefinition,
  },
  withoutId
);

const CoveLightSchema = new Schema<CoveLight>(
  {
    lengthInRunningFeet: nonNegativeNumber(0),
    ...pricedDefinition,
  },
  withoutId
);

const CeilingFinishSchema = new Schema<CeilingFinish>(
  {
    ceilingType: enumField(CEILING_TYPES, "none"),
    levelFromFloor: nonNegativeNumber(DEFAULT_WALL_HEIGHT_MILLIMETRES - 300),
    bandWidth: nonNegativeNumber(600),
    colour: colourString("#F6F4EF"),
    flatAreaInSquareFeet: nonNegativeNumber(0),
    dropAreaInSquareFeet: nonNegativeNumber(0),
    hasCoveLight: { type: Boolean, default: true },
    coveLight: { type: CoveLightSchema, default: () => ({}) },
    ...areaDefinition,
    ...pricedDefinition,
  },
  withoutId
);

/* ------------------------------------------------------------------ */
/* Furniture, decor, lights, electrical points                         */
/* ------------------------------------------------------------------ */

const FurnitureAccessorySchema = new Schema<FurnitureAccessory>(
  {
    accessoryType: { type: String, trim: true, required: true, maxlength: 100 },
    label: trimmedString("", 200),
    ...pricedDefinition,
  },
  withId
);

const furnitureMaterialRole = () => ({ type: MaterialSelectionSchema, default: () => ({}) });

const FurnitureMaterialsSchema = new Schema<FurnitureMaterials>(
  {
    carcassBoard: furnitureMaterialRole(),
    backPanel: furnitureMaterialRole(),
    shutterFinish: furnitureMaterialRole(),
    edgeBanding: furnitureMaterialRole(),
    countertop: furnitureMaterialRole(),
    hinge: furnitureMaterialRole(),
    drawerChannel: furnitureMaterialRole(),
    handle: furnitureMaterialRole(),
    hangingRod: furnitureMaterialRole(),
  },
  withoutId
);

const FurnitureItemSchema = new Schema<FurnitureItem>(
  {
    code: trimmedString("", 20),
    furnitureType: { type: String, trim: true, required: true, maxlength: 100 },
    placement: { type: ObjectPlacementSchema, default: () => ({}) },
    width: nonNegativeNumber(600),
    height: nonNegativeNumber(720),
    depth: nonNegativeNumber(560),
    heightFromFloor: nonNegativeNumber(0),
    headboardHeight: nonNegativeNumber(0),
    shutterType: enumField(SHUTTER_TYPES, "standard"),
    shelfCount: { type: Number, min: 0, max: 20, default: 0 },
    drawerCount: { type: Number, min: 0, max: 12, default: 0 },
    hasHangingRod: { type: Boolean, default: false },
    hasHydraulicLift: { type: Boolean, default: false },
    hasUpholsteredHeadboard: { type: Boolean, default: false },
    isCustomSize: { type: Boolean, default: false },
    shutterFinishOverride: { type: MaterialSelectionSchema, default: null },
    accessories: { type: [FurnitureAccessorySchema], default: [] },
    pricingMethod: enumField(FURNITURE_PRICING_METHODS, "computedFromPanels"),
    priceBreakdown: { type: [PriceBreakdownLineSchema], default: [] },
    materialCost: nonNegativeNumber(0),
    materialOverrides: { type: FurnitureMaterialsSchema, default: null },
    // labourCost: nonNegativeNumber(0),
    installationCost: nonNegativeNumber(0),
    marginAmount: nonNegativeNumber(0),
    ...pricedDefinition,
  },
  withId
);

const DecorItemSchema = new Schema<DecorItem>(
  {
    decorType: { type: String, trim: true, required: true, maxlength: 100 },
    label: trimmedString("", 200),
    placement: { type: ObjectPlacementSchema, default: () => ({ placementType: "freeStanding" }) },
    width: nonNegativeNumber(600),
    height: nonNegativeNumber(600),
    depth: nonNegativeNumber(600),
    heightFromFloor: nonNegativeNumber(0),
    colour: colourString("#CDBFA8"),
    modelUrl: { type: String, trim: true, default: "" },
    /** Product photo from the Rate Configuration, shown on the item's front when there is no 3D model. */
    imageUrl: { type: String, trim: true, default: "", maxlength: 2000 },
    isIncludedInQuote: { type: Boolean, default: false },
    ...pricedDefinition,
  },
  withId
);

const LightWiringSchema = new Schema<LightWiring>({ ...pricedDefinition }, withoutId);

const StudioLightSchema = new Schema<StudioLight>(
  {
    lightType: requiredEnumField(LIGHT_TYPES),
    mountType: enumField(LIGHT_MOUNT_TYPES, "ceiling"),
    wattage: { type: Number, min: 0, max: 2000, default: 7 },
    colourTemperature: numberEnumField(COLOUR_TEMPERATURES_KELVIN, 4000),
    brightnessPercentage: { type: Number, min: 0, max: 100, default: 100 },
    beamAngleDegrees: { type: Number, min: 1, max: 180, default: 60 },
    isSwitchedOn: { type: Boolean, default: true },
    placement: { type: ObjectPlacementSchema, default: () => ({ placementType: "freeStanding" }) },
    height: nonNegativeNumber(0),
    lengthInRunningFeet: nonNegativeNumber(0),
    isIncludedInQuote: { type: Boolean, default: true },
    wiring: { type: LightWiringSchema, default: () => ({}) },
    ...pricedDefinition,
    // Lights are priced per item (one record = one fitting).
    quantity: { type: Number, min: 0, default: 1 },
  },
  withId
);

const ElectricalPointSchema = new Schema<ElectricalPoint>(
  {
    pointType: requiredEnumField(ELECTRICAL_POINT_TYPES),
    wallLabel: requiredEnumField(WALL_LABELS),
    positionAlongWall: anyNumber(0),
    heightFromFloor: nonNegativeNumber(1200),
    isIncludedInQuote: { type: Boolean, default: true },
    ...pricedDefinition,
    // One record is one point (Indian electrical work is priced per point).
    quantity: { type: Number, min: 0, default: 1 },
  },
  withId
);

const RoomPricingSchema = new Schema<RoomPricing>(
  {
    furnitureTotal: nonNegativeNumber(0),
    wallsTotal: nonNegativeNumber(0),
    floorTotal: nonNegativeNumber(0),
    ceilingTotal: nonNegativeNumber(0),
    openingsTotal: nonNegativeNumber(0),
    lightingTotal: nonNegativeNumber(0),
    electricalTotal: nonNegativeNumber(0),
    decorTotal: nonNegativeNumber(0),
    subtotal: nonNegativeNumber(0),
  },
  withoutId
);

const RoomSchema = new Schema<Room>(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    roomKind: enumField(ROOM_KINDS, "other"),
    layoutTemplate: enumField(ROOM_LAYOUT_TEMPLATES, "empty"),
    width: { type: Number, min: 1, required: true },
    depth: { type: Number, min: 1, required: true },
    wallHeight: nonNegativeNumber(DEFAULT_WALL_HEIGHT_MILLIMETRES),
    floorPlanPositionX: anyNumber(0),
    floorPlanPositionY: anyNumber(0),
    planBox: { type: PlanBoxSchema, default: null },
    isManuallyDrawn: { type: Boolean, default: false },
    lightingMode: enumField(LIGHTING_MODES, "day"),
    furnitureMaterials: { type: FurnitureMaterialsSchema, default: () => ({}) },
    walls: { type: [WallSchema], default: [] },
    openings: { type: [OpeningSchema], default: [] },
    floor: { type: FloorFinishSchema, default: () => ({}) },
    ceiling: { type: CeilingFinishSchema, default: () => ({}) },
    furniture: { type: [FurnitureItemSchema], default: [] },
    decorItems: { type: [DecorItemSchema], default: [] },
    lights: { type: [StudioLightSchema], default: [] },
    electricalPoints: { type: [ElectricalPointSchema], default: [] },
    pricing: { type: RoomPricingSchema, default: () => ({}) },
  },
  withId
);

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

const StudioRateSchema = new Schema<StudioRate>(
  {
    rateKey: { type: String, required: true, trim: true, maxlength: 100 },
    rateConfigurationItemId: { type: Schema.Types.ObjectId, ref: "RateConfigurationModel", default: null },
    rateConfigurationItemName: trimmedString(""),
    unitPrice: nonNegativeNumber(0),
    unit: enumField(PRICE_UNITS, "piece"),
    source: enumField(STUDIO_RATE_SOURCES, "manual"),
  },
  withId
);

const PriceListFileSchema = new Schema<PriceListFile>(
  {
    url: { type: String, required: true, trim: true },
    originalName: trimmedString("", 300),
    rowCount: nonNegativeNumber(0),
    appliedRateCount: nonNegativeNumber(0),
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
  },
  withId
);

const ShareLinkSchema = new Schema<ShareLink>(
  {
    token: { type: String, required: true, trim: true },
    showsPrices: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
    viewCount: nonNegativeNumber(0),
  },
  withId
);

const PaymentStageSchema = new Schema<PaymentStage>(
  {
    label: trimmedString("", 200),
    percentage: { type: Number, min: 0, max: 100, default: 0 },
  },
  withId
);

const ClientDetailsSchema = new Schema<ClientDetails>(
  {
    name: trimmedString("", 200),
    phone: trimmedString("", 40),
    email: trimmedString("", 200),
    address: trimmedString("", 600),
    gstin: trimmedString("", 20),
  },
  withoutId
);

const QuotationDetailsSchema = new Schema<QuotationDetails>(
  {
    client: { type: ClientDetailsSchema, default: () => ({}) },
    usesOrganisationDefaults: { type: Boolean, default: true },
    terms: { type: [String], default: [] },
    paymentSchedule: { type: [PaymentStageSchema], default: [] },
    validityDays: { type: Number, min: 1, max: 365, default: 15 },
    notes: trimmedString("", 2000),
  },
  withoutId
);

const FloorPlanFileSchema = new Schema<FloorPlanFile>(
  {
    fileType: requiredEnumField(FLOOR_PLAN_FILE_TYPES),
    url: { type: String, required: true, trim: true },
    originalName: trimmedString("", 300),
    pageNumber: { type: Number, min: 1, default: 1 },
    uploadedAt: { type: Date, default: Date.now },
  },
  withId
);

const ExtractionDetailsSchema = new Schema<ExtractionDetails>(
  {
    source: enumField(EXTRACTION_SOURCES, "pdfText"),
    lengthUnit: enumField(LENGTH_UNITS, "millimetre"),
    millimetresPerPixel: nonNegativeNumber(0),
    pageNumber: { type: Number, min: 1, default: 1 },
    pageWidthInPixels: nonNegativeNumber(0),
    pageHeightInPixels: nonNegativeNumber(0),
    renderScale: nonNegativeNumber(0),
    detectedRoomCount: nonNegativeNumber(0),
    detectedOpeningCount: nonNegativeNumber(0),
    warnings: { type: [String], default: [] },
    extractedAt: { type: Date, default: null },
  },
  withoutId
);

const StudioSchema = new Schema<IStudio>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", default: null },
    quoteNo: { type: String, trim: true, default: "" },
    quoteName: { type: String, trim: true, required: true, maxlength: MAXIMUM_QUOTE_NAME_LENGTH },
    status: enumField(STUDIO_STATUSES, "draft"),
    schemaVersion: { type: Number, default: STUDIO_SCHEMA_VERSION },
    version: { type: Number, min: 1, default: 1 },
    currency: { type: String, trim: true, maxlength: 3, default: "INR" },
    floorPlan: { type: FloorPlanFileSchema, default: null },
    extraction: { type: ExtractionDetailsSchema, default: () => ({}) },
    importOptions: {
      addOpenings: { type: Boolean, default: true },
      addSuggestedFurniture: { type: Boolean, default: false },
    },
    pricingSettings: {
      labourPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.labourPercentage },
      installationPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.installationPercentage },
      marginPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.marginPercentage },
      gstPercentage: { type: Number, min: 0, max: 100, default: DEFAULT_PRICING_SETTINGS.gstPercentage },
      projectAdjustmentPercentage: { type: Number, min: PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage, max: PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage, default: 0 },
    },
    studioRates: { type: [StudioRateSchema], default: [] },
    priceLock: {
      isLocked: { type: Boolean, default: false },
      lockedAt: { type: Date, default: null },
      lockedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
    },
    priceLists: { type: [PriceListFileSchema], default: [] },
    shareLinks: { type: [ShareLinkSchema], default: [] },
    quotationDetails: { type: QuotationDetailsSchema, default: () => ({}) },
    viewerSettings: {
      shadowCastingLightLimit: { type: Number, min: 0, max: 16, default: DEFAULT_SHADOW_CASTING_LIGHT_LIMIT },
      defaultLightingMode: enumField(LIGHTING_MODES, "day"),
    },
    rooms: { type: [RoomSchema], default: [] },
    totals: {
      subtotal: nonNegativeNumber(0),
      adjustmentAmount: { type: Number, default: 0 },
      gstAmount: nonNegativeNumber(0),
      grandTotal: nonNegativeNumber(0),
    },
    lock: {
      userId: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
      expiresAt: { type: Date, default: null },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
  },
  { timestamps: true, optimisticConcurrency: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

StudioSchema.index({ organizationId: 1 });
StudioSchema.index({ organizationId: 1, projectId: 1 });
StudioSchema.index({ organizationId: 1, updatedAt: -1 });
/** Public share links are looked up by token. */
StudioSchema.index({ "shareLinks.token": 1 }, { sparse: true });
/** Quote numbers are unique per organisation; the service retries on a clash. */
StudioSchema.index(
  { organizationId: 1, quoteNo: 1 },
  { unique: true, partialFilterExpression: { quoteNo: { $type: "string", $gt: "" } } }
);

/** Reads the number part of a quote number such as "STU-007" → 7. Returns 0 when it does not match. */
export const parseQuoteNumber = (quoteNo: string | null | undefined): number => {
  const match = new RegExp(`^${QUOTE_NUMBER_PREFIX}-(\\d+)$`).exec(quoteNo ?? "");
  return match ? Number.parseInt(match[1], 10) : 0;
};

export const formatQuoteNumber = (quoteNumber: number): string =>
  `${QUOTE_NUMBER_PREFIX}-${String(quoteNumber).padStart(3, "0")}`;

StudioSchema.pre("save", async function assignQuoteNumber() {
  if (!this.isNew || this.quoteNo) return;
  const latestStudio = await mongoose
    .model<IStudio>("StudioModel")
    .findOne({ organizationId: this.organizationId, quoteNo: { $regex: `^${QUOTE_NUMBER_PREFIX}-` } }, { quoteNo: 1 })
    .sort({ createdAt: -1 })
    .lean<Pick<IStudio, "quoteNo">>();
  this.quoteNo = formatQuoteNumber(parseQuoteNumber(latestStudio?.quoteNo) + 1);
});

const StudioModel = mongoose.model<IStudio>("StudioModel", StudioSchema);

/* ------------------------------------------------------------------ */
/* Studio settings (one per organisation)                              */
/* ------------------------------------------------------------------ */

const CompanyDetailsSchema = new Schema<CompanyDetails>(
  {
    companyName: trimmedString("", 200),
    tagline: trimmedString("", 300),
    addressLines: { type: [String], default: [] },
    phone: trimmedString("", 40),
    email: trimmedString("", 200),
    website: trimmedString("", 200),
    gstin: trimmedString("", 20),
    logoUrl: { type: String, trim: true, default: "", maxlength: 2000 },
    bankDetails: { type: [String], default: [] },
  },
  withoutId
);

const StudioSettingsSchema = new Schema<StudioSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    company: { type: CompanyDetailsSchema, default: () => ({}) },
    quotationDefaults: {
      terms: { type: [String], default: [] },
      paymentSchedule: { type: [PaymentStageSchema], default: [] },
      validityDays: { type: Number, min: 1, max: 365, default: 15 },
      notes: trimmedString("", 2000),
    },
    pricingDefaults: {
      labourPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.labourPercentage },
      installationPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.installationPercentage },
      marginPercentage: { type: Number, min: 0, max: 500, default: DEFAULT_PRICING_SETTINGS.marginPercentage },
      gstPercentage: { type: Number, min: 0, max: 100, default: DEFAULT_PRICING_SETTINGS.gstPercentage },
      projectAdjustmentPercentage: { type: Number, min: PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage, max: PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage, default: 0 },
    },
    staffAdjustmentLimits: {
      minimumPercentage: { type: Number, min: PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage, max: 0, default: DEFAULT_STAFF_ADJUSTMENT_LIMITS.minimumPercentage },
      maximumPercentage: { type: Number, min: 0, max: PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage, default: DEFAULT_STAFF_ADJUSTMENT_LIMITS.maximumPercentage },
    },
    production: {
      inHouseShutterFinishes: { type: [String], default: ["laminateMatt", "laminateGloss", "woodVeneer", "fluted"] },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
  },
  { timestamps: true }
);

StudioSettingsSchema.index({ organizationId: 1 }, { unique: true });

export const StudioSettingsModel = mongoose.model<StudioSettings>("StudioSettingsModel", StudioSettingsSchema);

export default StudioModel;
