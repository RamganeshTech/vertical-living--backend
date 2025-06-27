import mongoose, { model, Schema, Types } from "mongoose";
import { CarpentryMaterialArrivalSchema, CeramicSanitarywareMaterialArrivalSchema, ElectricalFittingMaterialArrivalSchema, FalseCeilingMaterialArrivalSchema, GlassMirrorMaterialArrivalSchema, HardwareMaterialArrivalSchema, ICarpentryItem, ICeramicSanitarywareItem, IElectricalFittingItem, IFalseCeilingItem, IGlassMirrorItem, IHardwareItem, ILightFixtureItem, IPaintItem, ITileItem, IUpholsteryCurtainItem, LightFixtureMaterialArrivalSchema, PaintMaterialArrivalSchema, TileMaterialArrivalSchema, UpholsteryCurtainMaterialArrivalSchema } from "./subMaterialArrivalSchema";




export interface IMaterialArrivalTimer {
  startedAt: Date | null;
  completedAt: Date | null;
  deadLine: Date | null;
  reminderSent: boolean
}


export interface MaterialArrivalShopDetails {
  shopName: String,
  address: String,
  contactPerson: String,
  phoneNumber: String,
}


export interface MaterialArrivalSiteDetail {
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}


export interface IMaterialArrival {
  projectId: Types.ObjectId;
  status: "pending" | "completed";
  isEditable: boolean;
  shopDetails: MaterialArrivalShopDetails,
  deliveryLocationDetails: MaterialArrivalSiteDetail,
  materialArrivalList: {
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
  timer: IMaterialArrivalTimer;
  generatedLink: string | null;
}


// Timer schema
const TimerSchema = new Schema<IMaterialArrivalTimer>({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
}, { _id: false });


const ShopDetailsSchema = new Schema<MaterialArrivalShopDetails>({
  shopName: String,
  address: String,
  contactPerson: String,
  phoneNumber: String,
}, { _id: false });

// Delivery Location Details Schema
const DeliveryLocationDetailsSchema = new Schema<MaterialArrivalSiteDetail>({
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}, { _id: false });

// Main schema
const MaterialArrivalSchema = new Schema<IMaterialArrival>({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  isEditable: { type: Boolean, default: true },

  shopDetails: ShopDetailsSchema,
  deliveryLocationDetails: DeliveryLocationDetailsSchema,

  materialArrivalList: {
    carpentry: [CarpentryMaterialArrivalSchema],
    hardware: [HardwareMaterialArrivalSchema],
    electricalFittings: [ElectricalFittingMaterialArrivalSchema],
    tiles: [TileMaterialArrivalSchema],
    ceramicSanitaryware: [CeramicSanitarywareMaterialArrivalSchema],
    paintsCoatings: [PaintMaterialArrivalSchema],
    lightsFixtures: [LightFixtureMaterialArrivalSchema],
    glassMirrors: [GlassMirrorMaterialArrivalSchema],
    upholsteryCurtains: [UpholsteryCurtainMaterialArrivalSchema],
    falseCeilingMaterials: [FalseCeilingMaterialArrivalSchema],
  },
  timer: { type: TimerSchema, required: true },
  generatedLink: { type: String, default: null },
}, { timestamps: true });


const MaterialArrivalModel = model("MaterialArrivalModel", MaterialArrivalSchema)

export default MaterialArrivalModel;

