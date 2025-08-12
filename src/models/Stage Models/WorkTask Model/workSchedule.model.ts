// models/WorkSchedule.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { IWorkPlan, IWorkSchedule, uploadSchema } from './WorkTask.model';
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

// interface WorkScheduleDocument extends Omit<IWorkSchedule, "_id">, Document {
//   _id: Types.ObjectId;
// }



interface WorkScheduleDocument extends IWorkSchedule, Document {}

const WorkPlanSchema = new Schema<IWorkPlan>({
  workType: { type: String,  },
  startDate: { type: String,  },
  endDate: { type: String,  },
  assignedTo: { type: Schema.Types.ObjectId, ref: "WorkerModel", default:null},
 upload: {
  type: uploadSchema,
  required: false,
  default: null
},
  notes: { type: String },
} , {_id:true});

const WorkScheduleSchema = new Schema<WorkScheduleDocument>({
  projectId: { type: Schema.Types.ObjectId, ref:"ProjectModel", required: true },
  stageId: { type: Schema.Types.ObjectId, ref: "WorkTaskStageScheduleModel", required: true },
  plans: [WorkPlanSchema],
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  remarks: { type: String },
}, { timestamps: true });

WorkScheduleSchema.plugin(procurementLogger)

export const WorkScheduleModel = mongoose.model<WorkScheduleDocument>("WorkScheduleModel", WorkScheduleSchema);
