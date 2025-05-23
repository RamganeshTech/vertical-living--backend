import mongoose, { Schema } from "mongoose"

interface projectInformation {
    owner: string
    tags: string[] | []
    startDate: (Date | null)
    endDate: (Date | null)
    dueDate: (Date | null)
    duration: (Date | null)
    priority: "None" | "Low" | "Medium" | "High"
    status: "Open" | "In Progress" | "In Review" | "To be Tested" | "On Hold" | "Delayed" | "Closed" | "Cancelled";
    projectGroup: mongoose.Schema.Types.ObjectId | null,
    completionTime: (string | null),
    TaskAndIssuePrefix: (string | null),
}


interface IProject extends Document {
    projectId: string,
    projectName: string,
    description: (string | null);
    projectInformation: projectInformation
    tasks: (number | null),
    issues: (number | null),
    phases: (number | null),
    completionPercentage: (number | null),
    projectAccess: string
}

const ProjectSchema: Schema<IProject> = new Schema({
    projectId: {
        type: String,
        required: true,
        unique: true,
    },
    projectName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: null
    },
    projectInformation: {
        owner: {
            type: String,
            required: true,
        },
        tags: {
            type: [String],
            default: []
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        },
        dueDate: {
            type: Date,
            default: null
        },
        duration: {
            type: Date,
            default: null
        },
        priority: {
            type: String,
            default: "none"
        },
        status: {
            type: String,
            default: "Open"
        },
        completionTime: {
            type: String,
            default: null
        },
        TaskAndIssuePrefix: {
            type: String,
            default: null
        },
        projectGroup: {
            type: mongoose.Schema.ObjectId,
            default: null,
            ref: "ProjectGroup"
        },
    },
    tasks: {
        type: Number,
        default: 0,
    },
    issues: {
        type: Number,
        default: 0,
    },
    phases: {
        type: Number,
        default: 0,
    },
    completionPercentage: {
        type: Number,
        default: 0,
    },
    projectAccess: {
        type: String
    }
}, {
    timestamps: true
})

const ProjectModel = mongoose.model<IProject>("ProjectModel", ProjectSchema)

export default ProjectModel