import mongoose, { model, Schema, Types } from "mongoose";

export interface IUploadFile {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}

export interface IOrderingItem {
  name: string;
  brand: string | null;
  quantity: number | null;
  sellerName: string,
  sellerPhoneNo: string,
  unit: string | null;      // E.g. sq.ft, nos, etc.
  isOrdered: boolean;
  notes: string | null;
}

export interface IMaterialOrderingRoom {
  roomName: string;
  materials: IOrderingItem[];
  uploads: IUploadFile[];
  additionalNotes: string | null;
}


export interface IMaterialOrderingTimer {
  startedAt: Date | null;
  completedAt: Date | null;
  deadLine: Date | null;
  reminderSent: boolean
}


export interface IMaterialOrdering {
  projectId: Types.ObjectId;
  status: "pending" | "completed";
  isEditable: boolean;
  rooms: IMaterialOrderingRoom[];
  timer: IMaterialOrderingTimer;
}




// Upload file schema
const UploadSchema = new Schema<IUploadFile>({
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

// Material item schema
const MaterialItemSchema = new Schema<IOrderingItem>({
  name: { type: String },
  brand: { type: String, default: null },
  quantity: { type: Number, default: null },
  unit: { type: String, default: null },
  sellerName: { type: String, default: null},
  sellerPhoneNo: {type: String, default: null},
  isOrdered: {type:Boolean, default:false},
  notes: { type: String, default: null },
}, { _id: false });

// Per-room schema
const MaterialOrderingRoomSchema = new Schema<IMaterialOrderingRoom>({
  roomName: { type: String, required: true },
  materials: { type: [MaterialItemSchema], default: [] },
  uploads: { type: [UploadSchema], default: [] },
  additionalNotes: { type: String, default: null },
}, { _id: true });

// Timer schema
const TimerSchema = new Schema<IMaterialOrderingTimer>({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
}, { _id: false });

// Main schema
const OrderingMaterialSchema = new Schema<IMaterialOrdering>({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  isEditable: { type: Boolean, default: true },
  rooms: { type: [MaterialOrderingRoomSchema], default: [] },
  timer: { type: TimerSchema, required: true },
}, { timestamps: true });


const OrderingMaterialModel = model("OrderingMaterialModel", OrderingMaterialSchema)

export default OrderingMaterialModel;