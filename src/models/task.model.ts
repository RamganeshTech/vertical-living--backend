import mongoose, { Schema } from "mongoose"


export interface TaskInformation {
    workHours: string
    billingType: (string | null),
    owner: string
    tags: string[]
    startDate: (Date | null)
    endDate: (Date | null)
    dueDate: (Date | null)
    duration: (Date | null)
    priority: "None" | "Low" | "Medium" | "High"
    completionPercentage: number,
    reminder: Reminder
}

export interface Reminder {
    date: (Date | null),
    time: (Date | null),
    days: (Date | null),
    users: string[]
    emailTemplate: (string | null)
}

export interface Comments {
    commentorName: (string | null),
    comment: (string | null)
    commentedTime: (Date | null),
}

export interface TaskDocument {
    data: Buffer;
    contentType: string;
    filename: string;
}

export interface AssociatedTeams {
    teamsID:mongoose.Schema.Types.ObjectId
}

export interface ITask extends Document {
    taskId: string
    taskListId: mongoose.Schema.Types.ObjectId;
    taskName: string;
    description: (string | null);
    status: "Open" | "In Progress" | "In Review" | "To be Tested" | "On Hold" | "Delayed" | "Closed" | "Cancelled";
    associatedTeams: AssociatedTeams[]
    taskInformation: TaskInformation;
    comments: Comments[],
    // document:File
    document: TaskDocument
}

const TaskSchema = new Schema<ITask>({
    taskId: {
        type: String,
        required: true,
        unique: true,
    },
    taskListId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"TaskListModel",
        unique:true
    },
    taskName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default:null
    },
    status: {
        type: String,
        default: "Open"
    },
    associatedTeams: [{
        teamsId: {type: mongoose.Schema.ObjectId}
    }],
    taskInformation: {
        workHours: {
            type: String,
            default: "00:00"
        },
        billingType: {
            type: String,
            default:null
        },
        owner: {
            type: String,
        },
        tags: [{
            type: String,
            // default:null
        }],
        startDate: {
            type: Date,
            default:null
        },
        endDate: {
            type: Date,
            default:null
        },
        dueDate: {
            type: Date,
            default:null
        },
        duration: {
            type: Date,
            default:null
        },
        priority: {
            type: String,
            default: "none"
        },
        completionPercentage: {
            type: Number,
            default: 0
        },
    },
    comments: [{
        commentorName: {
            type: String,
            default:null
        },
        comment: {
            type: String,
            default:null

        },
        commentedTime: {
            type: Date,
            default:null
        },
    }],
    document: {
        type: Buffer, // represents binary file data
        contentType: String, // optional: e.g., 'application/pdf'
        filename: String,    // optional: original filename
    }
}, {
    timestamps: true
});

const TaskModel = mongoose.model<ITask>("TaskModel", TaskSchema);
export default TaskModel;