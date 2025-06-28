// models/DailySchedule.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { IDailyTask, IDailySchedule, uploadSchema } from './WorkTask.model';

interface DailyScheduleDocument extends IDailySchedule, Document { }

const DailyTaskSchema = new Schema<IDailyTask>({
    taskName: { type: String, },
    date: { type: String, },
    description: { type: String, },
    status: {
        type: String,
        enum: ["not_started", "in_progress", "completed"],
        default: "not_started",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "WorkerModel",  default:null},
   upload: {
  type: uploadSchema,
  required: false,
  default: null
}
}, {_id:true});

const DailyScheduleSchema = new Schema<DailyScheduleDocument>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    stageId: { type: Schema.Types.ObjectId, ref: "WorkTaskStageScheduleModel", required: true },
    tasks: [DailyTaskSchema],
    status: {
        type: String,
        enum: ["pending", "submitted", "approved", "rejected"],
        default: "pending",
    },
    remarks: { type: String },
}, { timestamps: true });

export const DailyScheduleModel =  mongoose.model<DailyScheduleDocument>("DailyScheduleModel", DailyScheduleSchema);
