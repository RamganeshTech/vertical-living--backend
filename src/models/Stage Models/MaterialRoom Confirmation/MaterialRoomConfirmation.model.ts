
// export interface IMaterialRoomUpload {
//   type: "image" | "pdf";
//   url: string;
//   originalName?: string;
//   uploadedAt: Date
// }



// import mongoose, { Document, model, Schema, Types } from "mongoose";
// import { IRoomItemEntry, } from './MaterialRoomTypes'
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";


// // 👇 Room with a set of predefined items
// export interface IPredefinedRoom {
//   name: string; // predefined names only
//   roomFields: {
//     [key: string]: IRoomItemEntry | { [key: string]: IRoomItemEntry }; // support for attachedBathroom etc.
//   };
//   uploads: IMaterialRoomUpload[];
// }

// export interface ICustomRoom {
//   name: string;
//   items: {
//     itemKey: string;
//     quantity: number;
//     unit: string;
//     remarks?: string;
//   }[];
//   uploads: IMaterialRoomUpload[];
// }



// // 👇 Final model interface for Material Selection
// export interface IMaterialRoomConfirmation extends Document {
//   projectId: Types.ObjectId;
//   rooms: IPredefinedRoom[];
//   customRooms: ICustomRoom[];
//   status: "pending" | "completed";
//   isEditable: boolean;
//   timer: {
//     startedAt: Date | null;
//     completedAt: Date | null;
//     deadLine: Date | null;
//     reminderSent: boolean;
//   };
//   assignedTo: Types.ObjectId;

// }


// const uploadSchema = new Schema<IMaterialRoomUpload>({
//   type: { type: String, enum: ["image", "pdf"], required: true },
//   url: { type: String, required: true },
//   originalName: { type: String },
//   uploadedAt: { type: Date, },
// }, { _id: true });


// const timerSchema = new Schema(
//   {
//     startedAt: { type: Date, default: null },
//     completedAt: { type: Date, default: null },
//     deadLine: { type: Date, default: null },
//     reminderSent: { type: Boolean, default: false },
//   },
//   { _id: false }
// );


// const roomSchema = new Schema(
//   {
//     name: { type: String },
//     roomFields: {
//       type: Schema.Types.Mixed, // Holds one of the schemas
//     },
//     uploads: [uploadSchema],
//   },
//   { _id: true }
// )


// const customRoomSchema = new Schema({
//   name: { type: String, required: true },
//   items: [{
//     itemKey: { type: String, required: true },
//     quantity: { type: Number, default: 0 },
//     unit: { type: String, default: "" },
//     remarks: { type: String, default: null },
//   }],
//   uploads: [uploadSchema]
// }, { _id: true });


// const materialRoomConfirmationSchema = new Schema<IMaterialRoomConfirmation>(
//   {
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ProjectModel",
//       required: true,
//     },
//     rooms: [roomSchema],
//     customRooms: [customRoomSchema],
//     status: { type: String, enum: ["pending", "completed"], default: "pending" },
//     isEditable: { type: Boolean, default: true },
//     assignedTo: {
//       type: Schema.Types.ObjectId,
//       default: null,
//       ref: "StaffModel"
//     },
//     timer: timerSchema,
//   },
//   { timestamps: true }
// );

// materialRoomConfirmationSchema.index({projectId:1})

// materialRoomConfirmationSchema.plugin(procurementLogger);

// const MaterialRoomConfirmationModel = model<IMaterialRoomConfirmation>(
//   "MaterialRoomConfirmationModel",
//   materialRoomConfirmationSchema
// );

// export default MaterialRoomConfirmationModel




export interface IMaterialRoomUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}



import mongoose, { Document, model, Schema, Types } from "mongoose";
import { IRoomItemEntry, } from './MaterialRoomTypes'
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";
import { Items, ItemSchema } from "../requirment model/mainRequirementNew.model";


// 👇 Room with a set of predefined items
// export interface IPredefinedRoom {
//   name: string; // predefined names only
//   roomFields: {
//     [key: string]: IRoomItemEntry | { [key: string]: IRoomItemEntry }; // support for attachedBathroom etc.
//   };
//   uploads: IMaterialRoomUpload[];
// }


export interface IMaterialRoom {
  name: string; // predefined names only
  roomFields: Items[];
  uploads: IMaterialRoomUpload[];
}

// 👇 Final model interface for Material Selection
export interface IMaterialRoomConfirmation extends Document {
  projectId: Types.ObjectId;
  rooms: IMaterialRoom[];
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


const roomSchema = new Schema<IMaterialRoom>(
  {
    name: { type: String },
    roomFields: { type: [ItemSchema], default: [] },
    uploads: [uploadSchema],
  },
  { _id: true }
)

const materialRoomConfirmationSchema = new Schema<IMaterialRoomConfirmation>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectModel",
      required: true,
    },
    rooms: [roomSchema],
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

const MaterialRoomConfirmationModel = model<IMaterialRoomConfirmation>(
  "MaterialRoomConfirmationModel",
  materialRoomConfirmationSchema
);

export default MaterialRoomConfirmationModel
