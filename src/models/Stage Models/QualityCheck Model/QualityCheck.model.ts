// export interface QualityCheckUpload {
//   type: "image" | "pdf";
//   url: string;
//   originalName?: string;
//   uploadedAt: Date
// }

// export interface QualityCheckItem {
//   workName: string;
//   status: "pass" | "fail" | "pending";
//   inspectedBy: Types.ObjectId;
//   inspectedUserModel: string;
//   remarks: string;
//   upload: QualityCheckUpload | null
// }

// export interface IQualityCheckup extends Document {
//   projectId: Types.ObjectId;
//   isEditable: boolean;
//   status: "pending" | "completed";
//   timer: {
//     startedAt: Date | null;
//     completedAt: Date | null;
//     deadLine: Date | null;
//     reminderSent: boolean;
//   };
//   LivingRoom: QualityCheckItem[];
//   Bedroom: QualityCheckItem[];
//   Kitchen: QualityCheckItem[];
//   DiningRoom: QualityCheckItem[];
//   Balcony: QualityCheckItem[];
//   FoyerArea: QualityCheckItem[];
//   Terrace: QualityCheckItem[];
//   StudyRoom: QualityCheckItem[];
//   CarParking: QualityCheckItem[];
//   Garden: QualityCheckItem[];
//   StorageRoom: QualityCheckItem[];
//   EntertainmentRoom: QualityCheckItem[];
//   HomeGym: QualityCheckItem[];
//   assignedTo: Types.ObjectId;

// }


// import { Schema, model, Types, Document } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

// const UploadSchema = new Schema<QualityCheckUpload>({
//   type: { type: String, enum: ["image"],  },
//   url: { type: String,  },
//   originalName: { type: String,  },
//   uploadedAt: { type: Date, default: new Date() },
// }, { _id: true });

// const QualityCheckItemSchema = new Schema<QualityCheckItem>({
//   workName: { type: String, required: true },
//   status: { type: String, enum: ["pass", "fail", "pending"], default: "pending" },
//   inspectedBy: { type: Schema.Types.ObjectId, refPath: "inspectedUserModel" },
//   inspectedUserModel: { type: String },
//   remarks: { type: String },
//   upload: { type: UploadSchema, required: false },
// }, { _id: true });

// const QualityCheckupSchema = new Schema<IQualityCheckup>({
//   projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
//   isEditable: { type: Boolean, default: true },
//   status: { type: String, enum: ["pending", "completed"], default: "pending" },
//   timer: {
//     startedAt: { type: Date, default: null },
//     completedAt: { type: Date, default: null },
//     deadLine: { type: Date, default: null },
//     reminderSent: { type: Boolean, default: false },
//   },
//   LivingRoom: [QualityCheckItemSchema],
//   Bedroom: [QualityCheckItemSchema],
//   Kitchen: [QualityCheckItemSchema],
//   DiningRoom: [QualityCheckItemSchema],
//   Balcony: [QualityCheckItemSchema],
//   FoyerArea: [QualityCheckItemSchema],
//   Terrace: [QualityCheckItemSchema],
//   StudyRoom: [QualityCheckItemSchema],
//   CarParking: [QualityCheckItemSchema],
//   Garden: [QualityCheckItemSchema],
//   StorageRoom: [QualityCheckItemSchema],
//   EntertainmentRoom: [QualityCheckItemSchema],
//   HomeGym: [QualityCheckItemSchema],
//   assignedTo: {
//     type: Schema.Types.ObjectId,
//     default: null,
//     ref: "StaffModel"
//   },
// }, {
//   timestamps: true,
// });

// QualityCheckupSchema.index({projectId:1})
// QualityCheckupSchema.plugin(procurementLogger)


// export const QualityCheckupModel = model("QualityCheckupModel", QualityCheckupSchema);



export interface QualityCheckUpload {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt: Date
}

export interface QualityCheckItem {
  workName: string;
  status: "pass" | "fail" | "pending";
  inspectedBy: Types.ObjectId;
  inspectedUserModel: string;
  remarks: string;
  upload: QualityCheckUpload | null
}


export interface QualityRoomSchema {
  roomName:string,
  tasks:QualityCheckItem[]
}

export interface IQualityCheckup extends Document {
  projectId: Types.ObjectId;
  isEditable: boolean;
  status: "pending" | "completed";
  timer: {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean;
  };
  rooms: QualityRoomSchema[]
  assignedTo: Types.ObjectId;

}


import { Schema, model, Types, Document } from "mongoose";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

const UploadSchema = new Schema<QualityCheckUpload>({
  type: { type: String, enum: ["image"],  },
  url: { type: String,  },
  originalName: { type: String,  },
  uploadedAt: { type: Date, default: new Date() },
}, { _id: true });

const QualityCheckItemSchema = new Schema<QualityCheckItem>({
  workName: { type: String, required: true },
  status: { type: String, enum: ["pass", "fail", "pending"], default: "pending" },
  inspectedBy: { type: Schema.Types.ObjectId, refPath: "inspectedUserModel" },
  inspectedUserModel: { type: String },
  remarks: { type: String },
  upload: { type: UploadSchema, required: false },
}, { _id: true });


const roomSchema = new Schema<QualityRoomSchema>({
  roomName:{type:String, default:null},
  tasks: {type: [QualityCheckItemSchema], default:[]}
})

const QualityCheckupSchema = new Schema<IQualityCheckup>({
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
  isEditable: { type: Boolean, default: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  timer: {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deadLine: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
  },
  rooms: {type: [roomSchema], default:[]},
  assignedTo: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "StaffModel"
  },
}, {
  timestamps: true,
});

QualityCheckupSchema.index({projectId:1})
QualityCheckupSchema.plugin(procurementLogger)


export const QualityCheckupModel = model("QualityCheckupModel", QualityCheckupSchema);
