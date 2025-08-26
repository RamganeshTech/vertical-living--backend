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
    tasks: Types.ObjectId[];         // List of tasks for the project
    status: "pending" | "completed";
    createdAt?: Date;
    updatedAt?: Date;
}



// const DailyTaskSchema = new Schema<IDailyTask>({
//     taskName: { type: String, },
//     description: { type: String },
//     status: {
//         type: String,
//         enum: ["pending", "submitted", "approved", "rejected"],
//         default: "pending",
//     },
//     assignedTo: { type: Schema.Types.ObjectId, ref: "WorkerModel", default: null },
//     dates: [DailyTaskDateSchema], // Multiple specific dates with their own uploads
// }, { _id: true });


export interface IProjectAssignee {
    projectName: string;
    siteAddress: string;
    designReferenceId: string;
    carpenterName: string;   // could be ObjectId if linked
    supervisorName: string;  // could be ObjectId if linked
    plannedStartDate: Date;
}

export interface IWorkTask {
    datePlanned: Date;
    room: string;
    workDescription: string;
    startTime: string;      // e.g. "09:00"
    endTime: string;        // e.g. "17:30"
    materialsNeeded: string[];
    manpower: number;
    status: "planned" | "in-progress" | "completed";
    uploadedImages: IDailyTaskDate[],
}


export interface ISupervisorCheck {
    reviewerName: string;
    reviewerId: Types.ObjectId | null;
    reviewDateTime: Date;
    status: "approved" | "needs_changes" | "rejected";
    remarks: string;
    gatekeeping: "block" | "allow_with_watch";
}



export interface IComparisonImages {
    plannedImage: IUploadFile | null;
    actualImage: IUploadFile | null;
}


export interface IDailyTaskSub {
    projectId: Types.ObjectId,
    dailyTasks: IWorkTask[],
    projectAssignee: IProjectAssignee,
    designPlanImages: IUploadFile[],
    siteImages: IUploadFile[],
    comparison: IComparisonImages,
    supervisorCheck: ISupervisorCheck,
}


const ProjectAssigneeSchema = new Schema<IProjectAssignee>({
    projectName: { type: String, },
    siteAddress: { type: String, },
    designReferenceId: { type: String },
    carpenterName: { type: String },   // can later change to ref WorkerModel
    supervisorName: { type: String },  // can later change to ref StaffModel
    plannedStartDate: { type: Date },
}, { _id: false });



const ComparisonImagesSchema = new Schema<IComparisonImages>({
    plannedImage: { type: uploadSchema, default: null },
    actualImage: { type: uploadSchema, default: null },
}, { _id: false });


const SupervisorCheckSchema = new Schema<ISupervisorCheck>({
    reviewerName: { type: String, },
    reviewerId: { type: Schema.Types.ObjectId, ref: "StaffModel", default: null },
    reviewDateTime: { type: Date, default: new Date() },
    status: {
        type: String,
        enum: ["approved", "needs_changes", "rejected", null],
        default: null
    },
    remarks: { type: String },
    gatekeeping: {
        type: String,
        enum: ["block", "allow_with_watch"],
        default: "block",
    },
}, { _id: false });


const DailyTaskDateSchema = new Schema<IDailyTaskDate>({
    date: { type: Date }, // Full Date object
    uploads: [uploadSchema], // Multiple images per specific date
}, { _id: true });

const DailyTaskSchema = new Schema<IWorkTask>({
    datePlanned: { type: Date, },
    room: { type: String, },
    workDescription: { type: String, },
    startTime: { type: String },
    endTime: { type: String },
    materialsNeeded: [{ type: String }],
    manpower: { type: Number },
    status: {
        type: String,
        enum: ["planned", "in-progress", "completed"],
        default: "planned",
    },
    uploadedImages: { type: [DailyTaskDateSchema], default: [] }
}, { _id: true });


const DailyTaskSubSchema = new Schema<IDailyTaskSub>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true }, // <-- replace dailyScheduleId
    dailyTasks: [DailyTaskSchema],
    projectAssignee: { type: ProjectAssigneeSchema },
    designPlanImages: [uploadSchema],
    siteImages: [uploadSchema],
    comparison: ComparisonImagesSchema,
    supervisorCheck: SupervisorCheckSchema,
}, { timestamps: true });

export const DailyTaskSubModel = mongoose.model("DailyTaskSubModel", DailyTaskSubSchema);

const DailyScheduleSchema = new Schema<IDailySchedule>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    tasks: { type: [Schema.Types.ObjectId], ref: "DailyTaskModel", default: [] },
}, { timestamps: true });


export const DailyScheduleModel = mongoose.model("DailyScheduleModel", DailyScheduleSchema);
