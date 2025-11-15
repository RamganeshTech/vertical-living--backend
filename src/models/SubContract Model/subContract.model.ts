// import mongoose, { Schema, Document, Types } from "mongoose";


// export interface IFileItem {
//     type: "image" | "pdf";
//     url: string;
//     originalName?: string;
//     uploadedAt?: Date;
// }


// export interface IWorkerInfo {
//     _id?:Types.ObjectId,
//     dateOfCommencement: Date;
//     dateOfCompletion: Date,
//     workerName: string,
//     filesBeforeWork: IFileItem[],
//     filesAfterWork: IFileItem[],
//     labourCost: number,
//     materialCost: number,
//     totalCost: number,
//     status:string,
//     submissionToken: string
// }

// export interface ISubContract extends Document {
//     _id: Types.ObjectId,
//     organizationId: Types.ObjectId;
//     projectId: Types.ObjectId
//     workName: string,
//     workerInfo: IWorkerInfo[],
//     workOrderCreatedByModel: string,
//     workOrderCreatedBy: Types.ObjectId,
//     shrableLink: string | null
//     createdAt?:Date,
//     updatedAt?:Date,
// }



// const FileItemSchema = new Schema<IFileItem>({
//   type: { type: String, enum: ["image", "pdf"], required: true },
//   url: { type: String, required: true },
//   originalName: String,
//   uploadedAt: { type: Date, default: Date.now },
// }, {_id:true});

// const WorkerInfoSchema = new Schema<IWorkerInfo>({
//   dateOfCommencement: { type: Date, },
//   dateOfCompletion: { type: Date, },
//   workerName: { type: String, default:null },
//   filesBeforeWork: {type:[FileItemSchema], default:[]},
//   filesAfterWork: {type:[FileItemSchema], default:[]},
//   labourCost: { type: Number, default: 0 },
//   materialCost: { type: Number, default: 0 },
//   totalCost: { type: Number, default: 0 },
//   status: { type: String, default:"pending" },
//   submissionToken: { type: String, default:null },
// }, {_id:true});

// // -----------------------------
// // Main Schema
// // -----------------------------
// const SubContractSchema = new Schema<ISubContract>(
//   {
//     organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", },
//     workName: { type: String, default:null },
//     workOrderCreatedBy: { type: Schema.Types.ObjectId, refPath: "workOrderCreatedByModel", },
//     workOrderCreatedByModel: { type: String, },
//     shrableLink: { type: String, default: null },
//     workerInfo:{type: [WorkerInfoSchema], default:[]}, // multiple workers can submit
//   },
//   { timestamps: true }
// );

// export const SubContractModel = mongoose.model<ISubContract>(
//   "SubContractModel",
//   SubContractSchema
// );





import mongoose, { Schema, Document, Types } from "mongoose";


export interface IFileItem {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}



export interface ISubContract extends Document {
  _id: Types.ObjectId,
  organizationId: Types.ObjectId;
  projectId: Types.ObjectId
  workName: string,
  workOrderCreatedByModel: string,
  workOrderCreatedBy: Types.ObjectId,
  token: string | null
  dateOfCommencement: Date;
  dateOfCompletion: Date,
  workerName: string,
  filesBeforeWork: IFileItem[],
  filesAfterWork: IFileItem[],
  labourCost: number,
  materialCost: number,
  totalCost: number,
  status: string,  
  createdAt?: Date,
  updatedAt?: Date,
}



const FileItemSchema = new Schema<IFileItem>({
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

// -----------------------------
// Main Schema
// -----------------------------
const SubContractSchema = new Schema<ISubContract>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", },
    workName: { type: String, default: null },
    workOrderCreatedBy: { type: Schema.Types.ObjectId, refPath: "workOrderCreatedByModel", },
    workOrderCreatedByModel: { type: String, },
    token: { type: String, default: null },
    dateOfCommencement: { type: Date, },
    dateOfCompletion: { type: Date, },
    workerName: { type: String, default: null },
    filesBeforeWork: { type: [FileItemSchema], default: [] },
    filesAfterWork: { type: [FileItemSchema], default: [] },
    labourCost: { type: Number, default: 0 },
    materialCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export const  SubContractModel = mongoose.model<ISubContract>(
  "SubContractModel",
  SubContractSchema
);