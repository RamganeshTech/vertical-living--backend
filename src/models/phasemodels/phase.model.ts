import mongoose, { Schema, Types } from "mongoose";
import { Comments } from "../task model/task.model"
import { PhaseTaskList } from "./phaseTaskList.model";

interface IPhase extends Document {
    phaseId: string,
    projectId: mongoose.Schema.Types.ObjectId,
    phaseName: string,
    description: (string | null);
    status: "Active" | "reOpen" | "In Progress" | "Deferred" | "Archieved" | "On Hold" | "Delayed" | "Completed" | "Cancelled";
    completedPercentage: number,
    phaseInformation: PhaseInformation;
    comments: Types.ObjectId[],
    taskList: Types.ObjectId[],
    issues: Types.ObjectId[],
    startDate: Date,
    endDate: Date,
    phaseTaskListCompleted:number,
    phaseIssuesCompleted:number,
    releaseNotes:string[]
    
    // document:File
}

export interface PhaseInformation {
    chartView: object[],
    statusTimeline: {
        createdAt: (Date | null)
    },
    activeStream: {
        date: Date,
        userName: string,
        description: string,
        time: Date
    }[]
}

// EACH PHASE EXTRA INFORMATION SCHEMA
const PhaseInformationSchema = new Schema<PhaseInformation>({
  chartView: { type: [Schema.Types.Mixed], default: [] },
  statusTimeline: {
    createdAt: { type: Date, default: null },
  },
  activeStream:  {
    type: [
      {
        date: { type: Date },
        userName: { type: String },
        description: { type: String },
        time: { type: Date },
      }
    ],
    default: []
  }
});

// MAIN SCHEMA//
const PhaseSchema = new Schema<IPhase>({
  phaseId: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, required: true, ref: "ProjectModel" },
  phaseName: { type: String, required: true },
  description: { type: String, default: null },
  status: {
    type: String,
    enum: [
      "Active",
      "reOpen",
      "In Progress",
      "Deferred",
      "Archieved",
      "On Hold",
      "Delayed",
      "Completed",
      "Cancelled",
    ],
    default: "Active",
  },
  completedPercentage: { type: Number, default: 0 },
  phaseInformation: PhaseInformationSchema,
  comments: [{ type: Schema.Types.ObjectId, ref: "PhaseCommentModel", default: []  }],
  taskList: [{type: Schema.Types.ObjectId, ref:"PhaseTaskListModel",  default: []  }],
  issues: [{type: Schema.Types.ObjectId, ref:"IssueModel",  default: []}],
  startDate: Date,
  endDate: Date,
  phaseTaskListCompleted:{type:Number, default:0},
  phaseIssuesCompleted:{type:Number, default:0},
  releaseNotes:{type: [String], default:[]} //used to store the finished task list (not individual task task)
});

export const PhaseModel = mongoose.model<IPhase>("PhaseModel", PhaseSchema);