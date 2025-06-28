import { Types } from 'mongoose'



export interface IUploadFile {
    fileType: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface IWorkScheduleTimer {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
}

// interfaces/ProjectStageSchedule.ts
export interface IWorkMainStageSchedule {
    projectId: Types.ObjectId;
    dailyScheduleId: Types.ObjectId; // ref to DailySchedule
    workScheduleId: Types.ObjectId;  // ref to WorkSchedule
    mdApproval: {
        status: "pending" | "approved" | "rejected";
        remarks: string;
    };
    timer: IWorkScheduleTimer;
    status: "pending" | "completed";
    isEditable: boolean;
}

// interfaces/DailySchedule.ts
export interface IDailySchedule {
    projectId: Types.ObjectId;
    stageId: Types.ObjectId; // ref to ProjectStageSchedule
    tasks: IDailyTask[];
    status: "pending" | "completed";
    remarks: string;
}

export interface IDailyTask {
    date: string; // ISO date
    description: string;
    taskName: String
    status: "not_started" | "in_progress" | "completed";
    upload:IUploadFile,
    assignedTo: Types.ObjectId
}

// interfaces/WorkSchedule.ts
export interface IWorkSchedule {
    projectId: Types.ObjectId;
    stageId: Types.ObjectId; // ref to ProjectStageSchedule
    plans: IWorkPlan[];
    status: "pending" | "completed";
    remarks: string;
}

export interface IWorkPlan {
    workType: string;
    startDate: string; // ISO date
    endDate: string;   // ISO date
    assignedTo: Types.ObjectId;
    notes: string;
    upload:IUploadFile
}



// models/ProjectStageSchedule.model.ts
import mongoose, { Schema, Document } from "mongoose";


export const uploadSchema = new Schema<IUploadFile>({
    fileType: { type: String, enum: ["image", "pdf"] },
    url: { type: String },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });


interface WorkMainStageScheduleDocument extends IWorkMainStageSchedule, Document { }

const WorkMainStageScheduleSchema = new Schema<WorkMainStageScheduleDocument>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    dailyScheduleId: { type: Schema.Types.ObjectId, ref: "DailyScheduleModel" },
    workScheduleId: { type: Schema.Types.ObjectId, ref: "WorkScheduleModel", },
    mdApproval: {
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        remarks: { type: String },
    },
     timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },
    isEditable: { type: Boolean, default: true }
}, { timestamps: true });

const WorkMainStageScheduleModel = mongoose.model<WorkMainStageScheduleDocument>("WorkMainStageScheduleModel", WorkMainStageScheduleSchema);

export default WorkMainStageScheduleModel
