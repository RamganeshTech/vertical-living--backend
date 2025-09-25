export interface IMaterialRoomUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

import mongoose, { Document, model, Schema, Types } from "mongoose";

export interface IMaterialSubItems {
  materialName: string
  unit:string, 
  price: number,
  labourCost:number,
  quantity: number,
}
export interface IMatItems {
    itemName: string,
    quantity: number,
    unit?: string,
    materialItems: IMaterialSubItems[]
}

export interface IMaterialRoom {
  name: string; // predefined names only
  roomFields: IMatItems[];
  uploads: IMaterialRoomUpload[];
  totalCost: number
}

export interface IPackage {
  level:string,
  rooms:IMaterialRoom[]
}

// 👇 Final model interface for Material Selection
export interface IMaterialRoomConfirmation extends Document {
  projectId: Types.ObjectId;
  package: IPackage[]
  packageSelected: string,
  // rooms: IMaterialRoom[];
  status: "pending" | "completed";
  isEditable: boolean;
  timer: {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean;
  };
  assignedTo: Types.ObjectId;
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


const MaterialSubItemsSchema = new Schema<IMaterialSubItems>({
  materialName: { type: String, },
  unit: { type: String, },
  price: { type: Number, min: 0 },
  labourCost:{type:Number},
  quantity: { type: Number, default: 0 },
}, {_id:true});

const ItemsSchema = new Schema<IMatItems>({
  itemName: { type: String, },
  quantity: { type: Number, default: 0 },
  unit: { type: String, },
  materialItems: { type: [MaterialSubItemsSchema], default: [] },
}, {_id:true});

const roomSchema = new Schema<IMaterialRoom>(
  {
    name: { type: String },
    roomFields: { type: [ItemsSchema], default: [] },
    totalCost: {type: Number, default: 0},
    uploads: [uploadSchema],
  },
  { _id: true }
)

const PackageSchema = new Schema<IPackage>({
 level: {type:String, default: "economy", enum:["economy", "luxury", "premium"]},
 rooms: {type: [roomSchema], default:[]}
}, {_id:true})


const materialRoomConfirmationSchema = new Schema<IMaterialRoomConfirmation>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectModel",
      required: true,
    },
    package: {type:[PackageSchema], default:[]},
    packageSelected: {type: String, default: "economy"},
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "StaffModel"
    },
    timer: timerSchema,
  },
  { timestamps: true }
);

materialRoomConfirmationSchema.index({ projectId: 1 })

// materialRoomConfirmationSchema.plugin(procurementLogger);

// const MaterialRoomConfirmationModel = model<IMaterialRoomConfirmation>(
//   "MaterialRoomConfirmationModel",
//   materialRoomConfirmationSchema
// );

// export default MaterialRoomConfirmationModel