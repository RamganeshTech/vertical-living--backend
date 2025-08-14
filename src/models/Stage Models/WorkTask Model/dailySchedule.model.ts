// models/DailySchedule.model.ts
import mongoose, { Schema, Document } from "mongoose";
// import { IDailyTask, IDailySchedule, uploadSchema } from './WorkTask.model';
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

// interface DailyScheduleDocument extends IDailySchedule, Document { }

// const DailyTaskSchema = new Schema<IDailyTask>({
//     taskName: { type: String, },
//     date: { type: String, },
//     description: { type: String, },
//     status: {
//         type: String,
//         enum: ["not_started", "in_progress", "completed"],
//         default: "not_started",
//     },
//     assignedTo: { type: Schema.Types.ObjectId, ref: "WorkerModel",  default:null},
//    upload: {
//   type: uploadSchema,
//   required: false,
//   default: null
// }
// }, {_id:true});

// const DailyScheduleSchema = new Schema<DailyScheduleDocument>({
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
//     stageId: { type: Schema.Types.ObjectId, ref: "WorkTaskStageScheduleModel", required: true },
//     tasks: [DailyTaskSchema],
//     status: {
//         type: String,
//         enum: ["pending", "submitted", "approved", "rejected"],
//         default: "pending",
//     },
//     remarks: { type: String },
// }, { timestamps: true });



// DailyScheduleSchema.plugin(procurementLogger)


// export const DailyScheduleModel =  mongoose.model<DailyScheduleDocument>("DailyScheduleModel", DailyScheduleSchema);



import { Types } from "mongoose";
import { uploadSchema } from "./WorkTask.model";

export interface IUploadFile {
    fileType: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface IDailyTaskDate {
    date: Date;                  // Full Date object
    uploads: IUploadFile[];      // Multiple uploads for that date
}

export interface IDailyTask {
    taskName: string;
    description: string;
    status: "pending" | "submitted" | "approved" | "rejected"; // fixed here
    assignedTo: Types.ObjectId | null; // Worker reference
    dates: IDailyTaskDate[];     // Multiple dates per task
}

export interface IDailySchedule {
    projectId: Types.ObjectId;   // Project reference
    tasks: IDailyTask[];         // List of tasks for the project
    createdAt?: Date;
    updatedAt?: Date;
}

const DailyTaskDateSchema = new Schema<IDailyTaskDate>({
    date: { type: Date }, // Full Date object
    uploads: [uploadSchema], // Multiple images per specific date
}, { _id: true });

const DailyTaskSchema = new Schema<IDailyTask>({
    taskName: { type: String, },
    description: { type: String },
    status: {
        type: String,
        enum: ["pending", "submitted", "approved", "rejected"],
        default: "pending",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "WorkerModel", default: null },
    dates: [DailyTaskDateSchema], // Multiple specific dates with their own uploads
}, { _id: true });

const DailyScheduleSchema = new Schema<IDailySchedule>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    tasks: [DailyTaskSchema],
}, { timestamps: true });




export const DailyScheduleModel = mongoose.model("DailyScheduleModel", DailyScheduleSchema);
