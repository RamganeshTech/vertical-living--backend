
export interface IMaterialRoomUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}



import mongoose, { Document, model, Schema, Types } from "mongoose";
import { IRoomItemEntry, } from './MaterialRoomTypes'


// 👇 Room with a set of predefined items
export interface IPredefinedRoom {
  name: string; // predefined names only
  roomFields: {
    [key: string]: IRoomItemEntry | { [key: string]: IRoomItemEntry }; // support for attachedBathroom etc.
  };
  uploads: IMaterialRoomUpload[];
}

export interface ICustomRoom {
  name: string;
  items: {
    itemKey: string;
    quantity: number;
    unit: string;
    remarks?: string;
  }[];
  uploads: IMaterialRoomUpload[];
}



// 👇 Final model interface for Material Selection
export interface IMaterialRoomConfirmation extends Document {
  projectId: Types.ObjectId;
  rooms: IPredefinedRoom[];
  customRooms: ICustomRoom[];
  status: "pending" | "completed";
  isEditable: boolean;
  timer: {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean;
  };
}


const uploadSchema = new Schema<IMaterialRoomUpload>({
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: { type: String },
  uploadedAt: { type: Date, },
}, { _id: true });


const timerSchema = new Schema(
  {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deadLine: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
  },
  { _id: false }
);


const roomSchema = new Schema(
  {
    name: { type: String },
    roomFields: {
      type: Schema.Types.Mixed, // Holds one of the schemas
    },
    uploads: [uploadSchema],
  },
  { _id: true }
)


const customRoomSchema = new Schema({
  name: { type: String, required: true },
  items: [{
    itemKey: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    remarks: { type: String, default: null },
  }],
  uploads: [uploadSchema]
}, { _id: true });


const materialRoomConfirmationSchema = new Schema<IMaterialRoomConfirmation>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectModel",
      required: true,
      index: true,
    },
    rooms: [roomSchema],
    customRooms: [customRoomSchema],
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },
    timer: timerSchema,
  },
  { timestamps: true }
);

const MaterialRoomConfirmationModel = model<IMaterialRoomConfirmation>(
  "MaterialRoomConfirmationModel",
  materialRoomConfirmationSchema
);

export default MaterialRoomConfirmationModel
