import mongoose, { Schema } from "mongoose";
import { Comments } from "./task.model"

interface IPhase extends Document {
    phaseId: string,
    projectId: mongoose.Schema.Types.ObjectId,
    phaseName: string,
    description: (string | null);
    status: "Active" | "reOpen" | "In Progress" | "Deferred" | "Archieved" | "On Hold" | "Delayed" | "Completed" | "Cancelled";
    completedPercentage: number,
    phaseInformation: PhaseInformation;
    comments: Comments[],
    // document:File
    taskList: PhaseTaskList,
    issues: PhaseIssues,
    startDate: Date,
    endDate: Date,
    releaseNotes:string[]

}

interface PhaseTaskList {
    taskListId: mongoose.Schema.Types.ObjectId;
    taskListName: string;
    tags: string[],
    releaseNotes:string[], //used to store the 
    taskId: mongoose.Schema.Types.ObjectId[]
}

interface PhaseTaskInformation {
    phaseTaskListId: mongoose.Schema.Types.ObjectId
    taskName: string,
    owner: string
    tags: string[]
    startDate: (Date | null)
    endDate: (Date | null)
    dueDate: (Date | null)
    duration: (Date | null)
    priority: "None" | "Low" | "Medium" | "High"
    completionPercentage: number,
}

interface PhaseInformation {
    ChartView: object[],
    statusTimeline: {
        timeLeft: (Date | null)
    },
    activeStream: {
        date: Date,
        userName: string,
        description: string,
        time: Date
    }
}

interface PhaseIssues {
    phaseId: mongoose.Schema.Types.ObjectId,
    issueId: string,
    issueName: string,
    reporter: String,
    createdAt: Date,
    status: "In Progress" | "To be Tested" | "Closed",
    assigne: string,
    dueDate: Date,
    tags: string[],
    severity: string[]
}



const PhaseInformationSchema = new Schema({
  ChartView: { type: [Schema.Types.Mixed], default: [] },
  statusTimeline: {
    timeLeft: { type: Date, default: null },
  },
  activeStream: {
    date: Date,
    userName: String,
    description: String,
    time: Date,
  },
});

const PhaseTaskListSchema = new Schema({
  taskListId: { type: Schema.Types.ObjectId, required: true },
  taskListName: { type: String, required: true },
  tags: [String],
  taskId: [{ type: Schema.Types.ObjectId }],
});

const PhaseIssuesSchema = new Schema({
  phaseId: { type: Schema.Types.ObjectId, required: true },
  issueId: String,
  issueName: String,
  reporter: String,
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["In Progress", "To be Tested", "Closed"],
  },
  assigne: String,
  dueDate: Date,
  tags: [String],
  severity: [String],
});

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
  comments: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "UserModel" },
      message: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  taskList: PhaseTaskListSchema,
  issues: PhaseIssuesSchema,
  startDate: Date,
  endDate: Date,
  releaseNotes:[String] //used to store the finished task list (not individual task task)

});

export const PhaseModel = mongoose.model<IPhase>("Phase", PhaseSchema);