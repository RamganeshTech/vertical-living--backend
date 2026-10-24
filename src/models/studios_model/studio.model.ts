// import mongoose, { Document, Schema, Types } from "mongoose";

// /* -------------------------------------------------------------------------- */
// /*  Constants                                                                  */
// /* -------------------------------------------------------------------------- */

// export const STUDIO_SCHEMA_VERSION = 1;

// const DEFAULT_CEILING_HEIGHT = 3000;
// const MIN_DIMENSION = 10;
// const MAX_DIMENSION = 30000;
// const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

// // Anything the plan shows that is not part of the flat (stairs, lift, lobby...) is saved
// // with zone "non_room" so nothing is lost, but it is excluded from 3D and later from quotes.
// export const ROOM_TYPES = [
//   "living", "dining", "living_dining", "bedroom", "master_bedroom", "kids_bedroom",
//   "guest_bedroom", "kitchen", "toilet", "balcony", "utility", "pooja", "study",
//   "dress", "store_room", "passage",
//   "staircase", "lift", "lobby", "corridor", "shaft",
//   "other",
// ] as const;

// export const ROOM_ZONES = ["room", "non_room"] as const;

// export const WALL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

// export const OPENING_KINDS = [
//   "main_door", "door", "double_door", "sliding_door", "window", "sliding_window",
//   "french_window", "ventilator", "other",
// ] as const;

// export const OBJECT_CATEGORIES = [
//   "bed", "wardrobe", "table", "dining_table", "sofa", "tv_unit", "drawer", "study_table",
//   "kitchen_counter", "loft", "shoe_rack", "mirror", "fridge", "washing_machine",
//   "wash_basin", "dressing_unit", "other",
// ] as const;

// export const PART_KINDS = ["shutter", "drawer", "handle", "shelf", "carcass", "top", "other"] as const;
// export const ALIGNMENTS = ["start", "center", "end"] as const;
// export const DATA_SOURCES = ["extracted", "manual", "edited"] as const;
// export const FINISH_TYPES = ["matte", "gloss", "satin", "textured", "wood_grain"] as const;
// export const STUDIO_STATUSES = ["draft", "in_review", "confirmed", "archived"] as const;
// export const FILE_TYPES = ["image", "pdf"] as const;

// /* -------------------------------------------------------------------------- */
// /*  Types                                                                      */
// /* -------------------------------------------------------------------------- */

// export type RoomType = (typeof ROOM_TYPES)[number];
// export type RoomZone = (typeof ROOM_ZONES)[number];
// export type WallLabel = (typeof WALL_LABELS)[number];
// export type OpeningKind = (typeof OPENING_KINDS)[number];
// export type ObjectCategory = (typeof OBJECT_CATEGORIES)[number];
// export type PartKind = (typeof PART_KINDS)[number];
// export type Alignment = (typeof ALIGNMENTS)[number];
// export type DataSource = (typeof DATA_SOURCES)[number];
// export type FinishType = (typeof FINISH_TYPES)[number];
// export type StudioStatus = (typeof STUDIO_STATUSES)[number];
// export type FileType = (typeof FILE_TYPES)[number];

// /** Same shape as the shared file schema; swap this for your own import if you prefer. */
// export interface IFile {
//   _id: Types.ObjectId;
//   type: FileType;
//   url: string;
//   originalName?: string;
//   uploadedAt: Date;
// }

// /** What the review screen needs to know about an automatic extraction. */
// export interface IExtractionInfo {
//   model: string;
//   warnings: string[];
//   extractedAt: Date;
// }

// /** Reusable look of any element. Only overrides are stored; empty means "inherit". */
// export interface IAppearance {
//   materialId?: Types.ObjectId; // points to the material catalog (added later)
//   materialName?: string; // readable copy so the UI works before the catalog exists
//   colorHex?: string;
//   finish?: FinishType;
//   textureUrl?: string;
// }

// export interface ISize {
//   width?: number;
//   depth?: number;
//   height?: number;
// }

// export interface IPoint {
//   x: number;
//   y: number;
// }

// export interface IPlanBox {
//   page: number;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   scale?: number;
// }

// export interface IExtractionMeta {
//   source: DataSource;
//   confidence?: number; // 0..1, only meaningful for extracted values
//   estimated: boolean; // true when the value is a guess, not printed on the plan
//   rawText?: string; // text exactly as printed on the plan, kept for audit
// }

// export interface IPart extends IExtractionMeta {
//   _id: Types.ObjectId;
//   kind: PartKind;
//   label?: string;
//   size: ISize;
//   appearance: IAppearance;
// }

// export interface IStudioObject extends IExtractionMeta {
//   _id: Types.ObjectId;
//   category: ObjectCategory;
//   label?: string;
//   wallLabel?: WallLabel; // wall the object stands against
//   alignment?: Alignment; // position along that wall
//   positionX?: number; // optional exact position in room coordinates
//   positionY?: number;
//   positionZ?: number; // height above the floor in mm (lofts, mirrors, wall units)
//   options?: Map<string, string>; // per-type option set, e.g. shutter: "glass"
//   rotationDeg: number;
//   size: ISize;
//   appearance: IAppearance;
//   parts: IPart[];
// }

// export interface IOpening extends IExtractionMeta {
//   _id: Types.ObjectId;
//   kind: OpeningKind;
//   tag?: string; // legend tag on the plan, for example D1 or FW6
//   wallLabel?: WallLabel;
//   width?: number;
//   height?: number;
//   sill?: number;
//   offset?: number; // distance from the start of the wall, empty when unknown
//   planX?: number; // position on the floor plan, for the squares shown on the plan
//   planY?: number;
//   appearance: IAppearance;
// }

// export interface IWall {
//   _id: Types.ObjectId;
//   label: WallLabel;
//   length?: number;
//   height?: number;
//   appearance: IAppearance;
// }

// export interface IRoom extends IExtractionMeta {
//   _id: Types.ObjectId;
//   name: string;
//   type: RoomType;
//   zone: RoomZone;
//   include: boolean; // designer can switch a detected area in or out
//   width?: number;
//   depth?: number;
//   height?: number;
//   isRectangular: boolean;
//   notes?: string;
//   walls: IWall[];
//   layout?: IPoint; // where this room sits in the whole-floor 3D view (mm)
//   planBox?: IPlanBox; // the blue/orange box on the imported plan
//   openings: IOpening[];
//   objects: IStudioObject[];
//   floor: IAppearance;
//   ceiling: IAppearance;
// }

// export interface IStudio extends Document {
//   organizationId: Types.ObjectId; // required: every query is scoped by this
//   projectId?: Types.ObjectId; // optional link to the CRM project
//   floorPlan?: IFile; // the uploaded plan the rooms were extracted from
//   extraction?: IExtractionInfo; // how the rooms were read from the plan, empty for manual studios
//   name: string;
//   status: StudioStatus;
//   schemaVersion: number;
//   version: number;
//   units: "mm";
//   importOptions: {
//     addOpenings: boolean;
//     suggestFurniture: boolean;
//   };
//   defaults: {
//     ceilingHeight: number;
//     wall: IAppearance;
//     floor: IAppearance;
//     ceiling: IAppearance;
//   };
//   rooms: IRoom[];
//   lock?: { userId: Types.ObjectId; expiresAt: Date };
//   createdBy?: Types.ObjectId;
//   updatedBy?: Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// /* -------------------------------------------------------------------------- */
// /*  Sub-schemas                                                                */
// /* -------------------------------------------------------------------------- */

// const dimensionField = {
//   type: Number,
//   min: [MIN_DIMENSION, `must be at least ${MIN_DIMENSION}`],
//   max: [MAX_DIMENSION, `must be at most ${MAX_DIMENSION}`],
// };

// const FileSchema = new Schema<IFile>(
//   {
//     type: { type: String, enum: FILE_TYPES, required: true },
//     url: { type: String, required: true },
//     originalName: { type: String, trim: true },
//     uploadedAt: { type: Date, default: Date.now },
//   },
//   { _id: true }
// );

// const AppearanceSchema = new Schema<IAppearance>(
//   {
//     materialId: { type: Schema.Types.ObjectId },
//     materialName: { type: String, trim: true, maxlength: 120 },
//     colorHex: {
//       type: String,
//       validate: { validator: (value: string) => HEX_COLOR_REGEX.test(value), message: "colorHex must look like #A1B2C3" },
//     },
//     finish: { type: String, enum: FINISH_TYPES },
//     textureUrl: { type: String, trim: true, maxlength: 500 },
//   },
//   { _id: false }
// );

// const SizeSchema = new Schema<ISize>(
//   { width: dimensionField, depth: dimensionField, height: dimensionField },
//   { _id: false }
// );

// const PointSchema = new Schema<IPoint>(
//   {
//     x: { type: Number, required: true },
//     y: { type: Number, required: true },
//   },
//   { _id: false }
// );

// const PlanBoxSchema = new Schema<IPlanBox>(
//   {
//     page: { type: Number, default: 1, min: 1 },
//     x: { type: Number, required: true },
//     y: { type: Number, required: true },
//     width: { type: Number, required: true, min: 0 },
//     height: { type: Number, required: true, min: 0 },
//     scale: { type: Number, min: 0 },
//   },
//   { _id: false }
// );

// const extractionMetaFields = {
//   source: { type: String, enum: DATA_SOURCES, default: "manual" as DataSource },
//   confidence: { type: Number, min: 0, max: 1 },
//   estimated: { type: Boolean, default: false },
//   rawText: { type: String, trim: true, maxlength: 200 },
// };

// const PartSchema = new Schema<IPart>(
//   {
//     kind: { type: String, enum: PART_KINDS, required: true },
//     label: { type: String, trim: true, maxlength: 120 },
//     size: { type: SizeSchema, default: () => ({}) },
//     appearance: { type: AppearanceSchema, default: () => ({}) },
//     ...extractionMetaFields,
//   },
//   { _id: true }
// );

// const StudioObjectSchema = new Schema<IStudioObject>(
//   {
//     category: { type: String, enum: OBJECT_CATEGORIES, required: true },
//     label: { type: String, trim: true, maxlength: 120 },
//     wallLabel: { type: String, enum: WALL_LABELS },
//     alignment: { type: String, enum: ALIGNMENTS },
//     // positionX: { type: Number },
//     // positionY: { type: Number },

//     positionX: { type: Number, min: -MAX_DIMENSION, max: MAX_DIMENSION },
//     positionY: { type: Number, min: -MAX_DIMENSION, max: MAX_DIMENSION },
//     positionZ: { type: Number, default: 0, min: 0, max: MAX_DIMENSION },
//     options: { type: Map, of: String, default: () => ({}) },

//     rotationDeg: { type: Number, default: 0, min: -360, max: 360 },
//     size: { type: SizeSchema, default: () => ({}) },
//     appearance: { type: AppearanceSchema, default: () => ({}) },
//     parts: { type: [PartSchema], default: [] },
//     ...extractionMetaFields,
//   },
//   { _id: true }
// );

// const OpeningSchema = new Schema<IOpening>(
//   {
//     kind: { type: String, enum: OPENING_KINDS, required: true },
//     tag: { type: String, trim: true, maxlength: 20 },
//     wallLabel: { type: String, enum: WALL_LABELS },
//     width: dimensionField,
//     height: dimensionField,
//     sill: { type: Number, min: 0, max: MAX_DIMENSION },
//     offset: { type: Number, min: 0, max: MAX_DIMENSION },
//     planX: { type: Number },
//     planY: { type: Number },
//     appearance: { type: AppearanceSchema, default: () => ({}) },
//     ...extractionMetaFields,
//   },
//   { _id: true }
// );

// const WallSchema = new Schema<IWall>(
//   {
//     label: { type: String, enum: WALL_LABELS, required: true },
//     length: dimensionField,
//     height: dimensionField,
//     appearance: { type: AppearanceSchema, default: () => ({}) },
//   },
//   { _id: true }
// );

// const RoomSchema = new Schema<IRoom>(
//   {
//     name: { type: String, required: true, trim: true, maxlength: 120 },
//     type: { type: String, enum: ROOM_TYPES, default: "other" },
//     zone: { type: String, enum: ROOM_ZONES, default: "room" },
//     include: { type: Boolean, default: true },
//     width: dimensionField,
//     depth: dimensionField,
//     height: dimensionField,
//     isRectangular: { type: Boolean, default: true },
//     notes: { type: String, trim: true, maxlength: 1000 },
//     walls: { type: [WallSchema], default: [] },
//     layout: { type: PointSchema },
//     planBox: { type: PlanBoxSchema },
//     openings: { type: [OpeningSchema], default: [] },
//     objects: { type: [StudioObjectSchema], default: [] },
//     floor: { type: AppearanceSchema, default: () => ({}) },
//     ceiling: { type: AppearanceSchema, default: () => ({}) },
//     ...extractionMetaFields,
//   },
//   { _id: true }
// );

// /* -------------------------------------------------------------------------- */
// /*  Main schema                                                                */
// /* -------------------------------------------------------------------------- */

// const StudioSchema = new Schema<IStudio>(
//   {
//     organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
//     floorPlan: { type: FileSchema },
//     extraction: {
//       model: { type: String, trim: true, maxlength: 100 },
//       warnings: { type: [String], default: [] },
//       extractedAt: { type: Date },
//     },
//     name: { type: String, required: true, trim: true, maxlength: 200 },
//     status: { type: String, enum: STUDIO_STATUSES, default: "draft" },
//     schemaVersion: { type: Number, default: STUDIO_SCHEMA_VERSION },
//     version: { type: Number, default: 1 },
//     units: { type: String, enum: ["mm"], default: "mm" },
//     importOptions: {
//       addOpenings: { type: Boolean, default: true },
//       suggestFurniture: { type: Boolean, default: false },
//     },
//     defaults: {
//       ceilingHeight: { ...dimensionField, default: DEFAULT_CEILING_HEIGHT },
//       wall: { type: AppearanceSchema, default: () => ({}) },
//       floor: { type: AppearanceSchema, default: () => ({}) },
//       ceiling: { type: AppearanceSchema, default: () => ({}) },
//     },
//     rooms: { type: [RoomSchema], default: [] },
//     lock: {
//       userId: { type: Schema.Types.ObjectId, ref: "UserModel" },
//       expiresAt: { type: Date },
//     },
//     createdBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
//     updatedBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
//   },
//   { timestamps: true }
// );

// StudioSchema.index({ organizationId: 1, projectId: 1 });

// /**
//  * Cross-element rules that a field validator cannot express: ids must be unique across
//  * the studio (a client can send its own _id), a room cannot have two walls with the same
//  * label, and anything that points at a wall must point at one that exists in that room.
//  */
// StudioSchema.pre("validate", function (next) {
//   const seenIds = new Set<string>();
//   const registerId = (id: Types.ObjectId): boolean => {
//     const key = String(id);
//     if (seenIds.has(key)) return false;
//     seenIds.add(key);
//     return true;
//   };

//   for (const room of this.rooms) {
//     if (!registerId(room._id)) return next(new Error(`Duplicate id ${room._id}`));

//     const wallLabels = new Set<string>();
//     for (const wall of room.walls) {
//       if (!registerId(wall._id)) return next(new Error(`Duplicate id ${wall._id}`));
//       if (wallLabels.has(wall.label)) {
//         return next(new Error(`Room "${room.name}" has two walls labelled ${wall.label}`));
//       }
//       wallLabels.add(wall.label);
//     }

//     const referencesMissingWall = (label?: string): boolean =>
//       Boolean(label) && !wallLabels.has(label as string);

//     for (const opening of room.openings) {
//       if (!registerId(opening._id)) return next(new Error(`Duplicate id ${opening._id}`));
//       if (referencesMissingWall(opening.wallLabel)) {
//         return next(new Error(`Opening ${opening.tag ?? opening._id} points at missing wall ${opening.wallLabel}`));
//       }
//     }

//     for (const object of room.objects) {
//       if (!registerId(object._id)) return next(new Error(`Duplicate id ${object._id}`));
//       if (referencesMissingWall(object.wallLabel)) {
//         return next(new Error(`Object ${object.label ?? object._id} points at missing wall ${object.wallLabel}`));
//       }
//       for (const part of object.parts) {
//         if (!registerId(part._id)) return next(new Error(`Duplicate id ${part._id}`));
//       }
//     }
//   }

//   next();
// });

// const StudioModel = mongoose.model<IStudio>("StudioModel", StudioSchema);

// export default StudioModel;



//  SECOND VERSION


import mongoose, { Document, Schema, Types } from "mongoose";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const STUDIO_SCHEMA_VERSION = 4;

const DEFAULT_CEILING_HEIGHT = 3000;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

// Plan view: A top, B left, C bottom, D right. "F" = free-standing item in the room.
export const WALL_LABELS = ["A", "B", "C", "D"] as const;
export const ITEM_WALLS = ["A", "B", "C", "D", "F"] as const;
export const ITEM_CATEGORIES = ["unit", "decor"] as const;
export const SHUTTERS = ["std", "glass", "open"] as const;
export const OPENING_KINDS = ["door", "window", "slide", "vent", "arch"] as const;
export const ROTATIONS: readonly number[] = [0, 90, 180, 270];
export const ROOM_ZONES = ["room", "non_room"] as const;
export const DATA_SOURCES = ["extracted", "manual", "edited"] as const;
export const PRICE_SOURCES = ["none", "library", "manual"] as const;
// How the quantity is worked out, so the frontend knows what to recalculate when a room or item changes.
export const QUANTITY_BASES = ["fixed", "wall_area", "floor_area", "run_length"] as const;
export const STUDIO_STATUSES = ["draft", "in_review", "confirmed", "archived"] as const;
export const FILE_TYPES = ["image", "pdf"] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type WallLabel = (typeof WALL_LABELS)[number];
export type ItemWall = (typeof ITEM_WALLS)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type Shutter = (typeof SHUTTERS)[number];
export type OpeningKind = (typeof OPENING_KINDS)[number];
export type RoomZone = (typeof ROOM_ZONES)[number];
export type DataSource = (typeof DATA_SOURCES)[number];
export type PriceSource = (typeof PRICE_SOURCES)[number];
export type QuantityBasis = (typeof QUANTITY_BASES)[number];
export type StudioStatus = (typeof STUDIO_STATUSES)[number];
export type FileType = (typeof FILE_TYPES)[number];

/** Free-form extras. Use it for new features first, then promote stable fields to real ones. */
export type Attributes = Map<string, unknown>;

export interface IFile {
  _id: Types.ObjectId;
  type: FileType;
  url: string;
  originalName?: string;
  uploadedAt: Date;
}

export interface IExtractionInfo {
  model: string;
  warnings: string[];
  extractedAt: Date;
  mmPerPixel?: number;
}

/**
 * A chosen material or part together with its price and quantity.
 * materialId is optional, so a custom part (a handle, a light) can be priced by hand without a library entry.
 */
export interface IPricedMaterial {
  materialId?: Types.ObjectId; // link to the material library
  name?: string; // readable copy, so nothing needs populating
  productCode?: string; // the supplier's or library's code for this product
  textureUrl?: string;

  unitPrice: number; // minor units (paise) per priceUnit, snapshot taken when it was chosen
  priceUnit: string; // "piece", "sqft", "sqm", "running_ft", "set"...
  quantity: number; // pieces, or the area or length; kept up to date by the frontend
  quantityBasis: QuantityBasis;
  currency: string; // "INR"
  priceSource: PriceSource;
  pricedAt?: Date;
  note?: string;
}

export interface IPlanBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
}

export interface IExtractionMeta {
  source: DataSource;
  confidence?: number; // 0..1, only meaningful for extracted values
  estimated: boolean; // true when the value is a guess, not printed on the plan
  rawText?: string; // text exactly as printed on the plan, kept for audit
}

/** Small part attached to a piece of furniture: handle, light, hinge, lock, hydraulic lift... */
export interface IAccessory {
  _id: Types.ObjectId;
  key: string; // catalog key, for example "hyd", "led" or a future "handle_brass"
  name?: string; // readable copy
  accessoryType?: string; // "handle" | "light" | "fitting" ... (free string, catalog driven)
  attachedTo?: string; // where it sits on the unit: "shutter", "drawer", "shelf"...
  colorHex?: string;
  material?: IPricedMaterial; // price and quantity; absent means it adds nothing to the total
  attributes?: Attributes; // for example a light: { watt: 12, kelvin: 3000 }
}

/** One piece of furniture. Wall items use wall + offsetAlongWall; free items (wall "F") use freeX, freeZ, rotation. */
export interface IItem {
  _id: Types.ObjectId;
  category: ItemCategory; // "unit" = modular unit, "decor" = loose furniture
  type: string; // key in the frontend TYPES (unit) or DEC (decor) tables
  wall: ItemWall;
  offsetAlongWall: number; // mm along the wall from the room's outer corner (wall items)
  freeX: number; // free items: centre x in the room, mm
  freeZ: number; // free items: centre z in the room, mm
  rotation: number; // 0, 90, 180, 270
  width: number; // mm
  shutter?: Shutter;
  height?: number; // size overrides: absent = the type's standard
  depth?: number;
  heightFromFloor?: number;
  shelfCount?: number;
  drawerCount?: number;
  hangingRod?: number; // 0 or 1
  headboardHeight?: number;
  color?: string; // loose furniture colour
  material?: IPricedMaterial; // the item's own material and price
  accessories: IAccessory[];
  attributes?: Attributes;
}

export interface IOpening extends IExtractionMeta {
  _id: Types.ObjectId;
  wall: WallLabel;
  kind: OpeningKind;
  offset: number; // mm from the start of that wall
  width: number;
  height: number;
  sillHeight: number; // mm above the floor
  code: string; // D1, W2, KW... (the tag on the plan)
  frameColor: string;
  material?: IPricedMaterial;
  attributes?: Attributes;
}

/**
 * One covering on a wall. A wall can have several: tile from 0 to 1200 mm, paint above it.
 * layerType is a free string, so new coverings (stone cladding, 3D panels...) need no model change.
 */
export interface IWallLayer {
  _id: Types.ObjectId;
  layerType: string; // paint | texture | wallpaper | tile | fluted | wood | ...
  startHeight: number; // mm above the floor where this layer starts
  endHeight: number; // mm where it ends, 0 = up to the ceiling
  colorHex?: string;
  pattern?: string; // wallpaper pattern or tile size key
  material?: IPricedMaterial;
  attributes?: Attributes;
}

export interface IWall {
  _id: Types.ObjectId;
  label: WallLabel;
  length?: number; // mm
  height?: number; // mm
  layers: IWallLayer[]; // bottom to top; empty = existing wall
  attributes?: Attributes;
}

export interface IRoom extends IExtractionMeta {
  _id: Types.ObjectId;
  name: string;
  kind: string;
  zone: RoomZone;
  include: boolean; // designer can switch a detected area in or out
  notes?: string;
  width: number; // walls A and C, mm
  depth: number; // walls B and D, mm
  height: number; // ceiling height, mm
  floorX: number; // position on the whole floor, mm
  floorZ: number;
  planBox?: IPlanBox;
  walls: IWall[];
  openings: IOpening[];
  items: IItem[];
  carcass: string;
  finish: string;
  furnitureColor: string;
  furnitureMaterial?: IPricedMaterial;
  countertop: string;
  countertopMaterial?: IPricedMaterial;
  floorFinish: string;
  floorColor: string;
  floorMaterial?: IPricedMaterial;
  attributes?: Attributes;
}

export interface IStudio extends Document {
  organizationId: Types.ObjectId; // required: every query is scoped by this
  projectId?: Types.ObjectId;
  floorPlan?: IFile;
  extraction?: IExtractionInfo;
  quoteNo: string;
  quoteName: string;
  name: string;
  status: StudioStatus;
  schemaVersion: number;
  version: number;
  units: "mm";
  currency: string;
  importOptions: { addOpenings: boolean; addFurniture: boolean };
  defaults: { ceilingHeight: number };
  rooms: IRoom[];
  attributes?: Attributes;
  lock?: { userId: Types.ObjectId; expiresAt: Date };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/*  No upper limits: any floor plan size must be accepted.                     */
/* -------------------------------------------------------------------------- */

const positive = { type: Number, min: [1, "must be greater than 0"] as [number, string] };
const nonNegative = { type: Number, min: [0, "must not be negative"] as [number, string] };

const colorValidator = {
  validator: (value: string) => HEX_COLOR_REGEX.test(value),
  message: "colour must look like #A1B2C3",
};

// List entries get their own _id, and `id` (string of _id) is in JSON because the frontend reads `id`.
const withId = { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } };

const extractionMetaFields = {
  source: { type: String, enum: DATA_SOURCES, default: "manual" as DataSource },
  confidence: { type: Number, min: 0, max: 1 },
  estimated: { type: Boolean, default: false },
  rawText: { type: String, trim: true, maxlength: 200 },
};

// The escape hatch for features that do not have real fields yet.
const attributesField = { type: Map, of: Schema.Types.Mixed, default: undefined };

/** Line total in minor units. Use the same formula on the frontend so 3D and saved totals agree. A missing material adds nothing. */
export const lineTotal = (material?: Pick<IPricedMaterial, "unitPrice" | "quantity">) =>
  material ? Math.round(material.unitPrice * material.quantity) : 0;

/* -------------------------------------------------------------------------- */
/*  Shared sub-schema: material with price and quantity                        */
/* -------------------------------------------------------------------------- */

const PricedMaterialSchema = new Schema<IPricedMaterial>(
  {
    materialId: { type: Schema.Types.ObjectId }, // add ref: "MaterialModel" once that model exists
    name: { type: String, trim: true, maxlength: 120 },
    productCode: { type: String, trim: true, maxlength: 60 },
    textureUrl: { type: String, trim: true, maxlength: 500 },

    unitPrice: { ...nonNegative, default: 0 },
    priceUnit: { type: String, trim: true, maxlength: 20, default: "piece" },
    quantity: { ...nonNegative, default: 1 }, // decimals allowed: 42.5 sqft
    quantityBasis: { type: String, enum: QUANTITY_BASES, default: "fixed" },
    currency: { type: String, trim: true, maxlength: 3, default: "INR" },
    priceSource: { type: String, enum: PRICE_SOURCES, default: "none" },
    pricedAt: { type: Date },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/*  Sub-schemas                                                                */
/* -------------------------------------------------------------------------- */

const FileSchema = new Schema<IFile>(
  {
    type: { type: String, enum: FILE_TYPES, required: true },
    url: { type: String, required: true },
    originalName: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  withId
);

const PlanBoxSchema = new Schema<IPlanBox>(
  {
    page: { type: Number, default: 1, min: 1 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    scale: { type: Number, min: 0 },
  },
  { _id: false }
);

const AccessorySchema = new Schema<IAccessory>(
  {
    key: { type: String, required: true, trim: true, maxlength: 60 },
    name: { type: String, trim: true, maxlength: 120 },
    accessoryType: { type: String, trim: true, maxlength: 40 },
    attachedTo: { type: String, trim: true, maxlength: 40 },
    colorHex: { type: String, validate: colorValidator },
    material: { type: PricedMaterialSchema },
    attributes: attributesField,
  },
  withId
);

const ItemSchema = new Schema<IItem>(
  {
    category: { type: String, enum: ITEM_CATEGORIES, required: true },
    type: { type: String, required: true, trim: true, maxlength: 40 },
    wall: { type: String, enum: ITEM_WALLS, required: true, default: "A" },
    offsetAlongWall: { type: Number, default: 100 },
    freeX: { type: Number, default: 0 },
    freeZ: { type: Number, default: 0 },
    rotation: {
      type: Number,
      default: 0,
      validate: { validator: (v: number) => ROTATIONS.includes(v), message: "rotation must be 0, 90, 180 or 270" },
    },
    width: { ...positive, required: true },
    shutter: { type: String, enum: SHUTTERS },
    height: positive,
    depth: positive,
    heightFromFloor: nonNegative,
    shelfCount: nonNegative,
    drawerCount: nonNegative,
    hangingRod: { type: Number, validate: { validator: (v: number) => v === 0 || v === 1, message: "hangingRod must be 0 or 1" } },
    headboardHeight: positive,
    color: { type: String, validate: colorValidator },
    material: { type: PricedMaterialSchema },
    accessories: { type: [AccessorySchema], default: [] },
    attributes: attributesField,
  },
  withId
);

const OpeningSchema = new Schema<IOpening>(
  {
    wall: { type: String, enum: WALL_LABELS, required: true },
    kind: { type: String, enum: OPENING_KINDS, required: true },
    offset: { ...nonNegative, required: true },
    width: { ...positive, required: true },
    height: { ...positive, required: true },
    sillHeight: { ...nonNegative, default: 0 },
    code: { type: String, trim: true, maxlength: 20, default: "" },
    frameColor: { type: String, required: true, validate: colorValidator },
    material: { type: PricedMaterialSchema },
    attributes: attributesField,
    ...extractionMetaFields,
  },
  withId
);

const WallLayerSchema = new Schema<IWallLayer>(
  {
    layerType: { type: String, required: true, trim: true, maxlength: 40, default: "paint" },
    startHeight: { ...nonNegative, default: 0 },
    endHeight: { ...nonNegative, default: 0 }, // 0 = up to the ceiling
    colorHex: { type: String, validate: colorValidator },
    pattern: { type: String, trim: true, maxlength: 40 },
    material: { type: PricedMaterialSchema },
    attributes: attributesField,
  },
  withId
);

const WallSchema = new Schema<IWall>(
  {
    label: { type: String, enum: WALL_LABELS, required: true },
    length: positive,
    height: positive,
    layers: { type: [WallLayerSchema], default: [] },
    attributes: attributesField,
  },
  withId
);

// Catalog keys (kind, carcass, finish, countertop, floorFinish, item type) are plain strings on purpose:
// the frontend catalog is the single source, so adding a catalog entry never needs a backend deploy.
const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, required: true, trim: true, maxlength: 40, default: "other" },
    zone: { type: String, enum: ROOM_ZONES, default: "room" },
    include: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    width: { ...positive, required: true },
    depth: { ...positive, required: true },
    height: { ...positive, required: true, default: DEFAULT_CEILING_HEIGHT },
    floorX: { type: Number, required: true, default: 0 },
    floorZ: { type: Number, required: true, default: 0 },
    planBox: { type: PlanBoxSchema },
    walls: { type: [WallSchema], default: [] },
    openings: { type: [OpeningSchema], default: [] },
    items: { type: [ItemSchema], default: [] },
    carcass: { type: String, required: true, trim: true, maxlength: 40 },
    finish: { type: String, required: true, trim: true, maxlength: 40 },
    furnitureColor: { type: String, required: true, validate: colorValidator },
    furnitureMaterial: { type: PricedMaterialSchema },
    countertop: { type: String, required: true, trim: true, maxlength: 40, default: "none" },
    countertopMaterial: { type: PricedMaterialSchema },
    floorFinish: { type: String, required: true, trim: true, maxlength: 40, default: "none" },
    floorColor: { type: String, required: true, validate: colorValidator },
    floorMaterial: { type: PricedMaterialSchema },
    attributes: attributesField,
    ...extractionMetaFields,
  },
  withId
);

/* -------------------------------------------------------------------------- */
/*  Main schema                                                                */
/* -------------------------------------------------------------------------- */

const StudioSchema = new Schema<IStudio>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
    floorPlan: { type: FileSchema, default: null },
    quoteNo: { type: String, default: null },
    quoteName: { type: String, default: null },
    extraction: {
      model: { type: String, trim: true, maxlength: 100 },
      warnings: { type: [String], default: [] },
      extractedAt: { type: Date },
      mmPerPixel: { type: Number, min: 0 },
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: STUDIO_STATUSES, default: "draft" },
    schemaVersion: { type: Number, default: STUDIO_SCHEMA_VERSION },
    version: { type: Number, default: 1 },
    units: { type: String, enum: ["mm"], default: "mm" },
    currency: { type: String, trim: true, maxlength: 3, default: "INR" },
    importOptions: {
      addOpenings: { type: Boolean, default: true },
      addFurniture: { type: Boolean, default: false },
    },
    defaults: {
      ceilingHeight: { ...positive, default: DEFAULT_CEILING_HEIGHT },
    },
    rooms: { type: [RoomSchema], default: [] },
    attributes: attributesField,
    lock: {
      userId: { type: Schema.Types.ObjectId, ref: "UserModel" },
      expiresAt: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

StudioSchema.index({ organizationId: 1, projectId: 1 });


// Pre-save hook to automatically generate the studio quote number
StudioSchema.pre("save", async function () {
  if (this.isNew && !this.quoteNo) {
    const lastDoc = await mongoose
      .model<IStudio>("StudioModel")
      .findOne(
        { organizationId: this.organizationId },
        { quoteNo: 1 }
      )
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastDoc?.quoteNo) {
      const match = lastDoc.quoteNo.match(/^STU-(\d+)$/);

      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.quoteNo = `STU-${String(nextNumber).padStart(3, "0")}`;
  }
});

const StudioModel = mongoose.model<IStudio>("StudioModel", StudioSchema);

export default StudioModel;