import mongoose, { model, Schema, Types } from "mongoose";
import { CarpentryOrderMaterialSchema, CeramicSanitarywareOrderMaterialSchema, ElectricalFittingOrderMaterialSchema, FalseCeilingOrderMaterialSchema, GlassMirrorOrderMaterialSchema, HardwareOrderMaterialSchema, ICarpentryItem, ICeramicSanitarywareItem, IElectricalFittingItem, IFalseCeilingItem, IGlassMirrorItem, IHardwareItem, ILightFixtureItem, IPaintItem, ITileItem, IUpholsteryCurtainItem, LightFixtureOrderMaterialSchema, PaintOrderMaterialSchema, TileOrderMaterialSchema, UpholsteryCurtainOrderMaterialSchema } from "./subMateiralOrdering";

export interface IUploadFile {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}


export interface IMaterialOrderingTimer {
  startedAt: Date | null;
  completedAt: Date | null;
  deadLine: Date | null;
  reminderSent: boolean
}


export interface OrderMaterialShopDetails {
  shopName: String,
  address: String,
  contactPerson: String,
  phoneNumber: String,
}


export interface OrderMaterialSiteDetail {
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}


export interface IMaterialOrdering {
  projectId: Types.ObjectId;
  status: "pending" | "completed";
  isEditable: boolean;
  uploads: IUploadFile[],
  shopDetails: OrderMaterialShopDetails,
  deliveryLocationDetails: OrderMaterialSiteDetail,
  materialOrderingList: {
    carpentry: ICarpentryItem[];
    hardware: IHardwareItem[];
    electricalFittings: IElectricalFittingItem[];
    tiles: ITileItem[];
    ceramicSanitaryware: ICeramicSanitarywareItem[];
    paintsCoatings: IPaintItem[];
    lightsFixtures: ILightFixtureItem[];
    glassMirrors: IGlassMirrorItem[];
    upholsteryCurtains: IUpholsteryCurtainItem[];
    falseCeilingMaterials: IFalseCeilingItem[];
  };
  timer: IMaterialOrderingTimer;
  generatedLink: string | null;
}




// Upload file schema
const UploadSchema = new Schema<IUploadFile>({
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, default: new Date() },
}, { _id: true });


// Timer schema
const TimerSchema = new Schema<IMaterialOrderingTimer>({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
}, { _id: false });


const ShopDetailsSchema = new Schema<OrderMaterialShopDetails>({
  shopName: String,
  address: String,
  contactPerson: String,
  phoneNumber: String,
}, { _id: false });

// Delivery Location Details Schema
const DeliveryLocationDetailsSchema = new Schema<OrderMaterialSiteDetail>({
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}, { _id: false });

// Main schema
const OrderingMaterialSchema = new Schema<IMaterialOrdering>({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  isEditable: { type: Boolean, default: true },
uploads: [UploadSchema],

  shopDetails: ShopDetailsSchema,
  deliveryLocationDetails: DeliveryLocationDetailsSchema,

  materialOrderingList: {
    carpentry: [CarpentryOrderMaterialSchema],
    hardware: [HardwareOrderMaterialSchema],
    electricalFittings: [ElectricalFittingOrderMaterialSchema],
    tiles: [TileOrderMaterialSchema],
    ceramicSanitaryware: [CeramicSanitarywareOrderMaterialSchema],
    paintsCoatings: [PaintOrderMaterialSchema],
    lightsFixtures: [LightFixtureOrderMaterialSchema],
    glassMirrors: [GlassMirrorOrderMaterialSchema],
    upholsteryCurtains: [UpholsteryCurtainOrderMaterialSchema],
    falseCeilingMaterials: [FalseCeilingOrderMaterialSchema],
  },
  timer: { type: TimerSchema, required: true },
  generatedLink: { type: String, default: null },
}, { timestamps: true });


const OrderingMaterialModel = model("OrderingMaterialModel", OrderingMaterialSchema)

export default OrderingMaterialModel;

