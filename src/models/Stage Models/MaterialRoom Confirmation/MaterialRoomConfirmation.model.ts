import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMaterialRoomUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

export interface IMaterialWork {
  workName: string;
  notes?: string;
  materials: string[]; // Can be expanded to object if needed later
}

export interface IMaterialRoom {
  _id?: string;
  roomName: string;
  uploads: IMaterialRoomUpload[];
  modularWorks: IMaterialWork[];
}

export interface IMaterialRoomConfirmation {
  projectId: Types.ObjectId;
  rooms: IMaterialRoom[];
  status: "pending" | "completed";
  isEditable: boolean;
  timer: {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
  };
}




const uploadSchema = new Schema<IMaterialRoomUpload>({
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });

const modularWorkSchema = new Schema<IMaterialWork>({
  workName: { type: String,  },
  notes: { type: String , default:null},
  materials: [{ type: String }],
}, { _id: true });

const roomSchema = new Schema<IMaterialRoom>({
  roomName: { type: String, required: true },
  uploads: [uploadSchema],
  modularWorks: [modularWorkSchema],
}, { _id: true });

const timerSchema = new Schema({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
}, { _id: false });

const materialRoomConfirmationSchema = new Schema<IMaterialRoomConfirmation>({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true },
  rooms: [roomSchema],
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  isEditable: { type: Boolean, default: true },
  timer: timerSchema,
}, { timestamps: true });

const MaterialRoomConfirmationModel = mongoose.model("MaterialRoomConfirmationModel", materialRoomConfirmationSchema);
export default MaterialRoomConfirmationModel;
