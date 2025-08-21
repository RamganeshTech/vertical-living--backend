import mongoose, { Schema, Types } from "mongoose"
import procurementLogger from "../../Plugins/ProcurementDeptPluggin"

interface projectInformation {
    owner: string
    tags: string[] | []
    startDate: (Date | null)
    endDate: (Date | null)
    dueDate: (Date | null)
    duration: (number | null)
    priority: "none" | "low" | "medium" | "high"
    status: "Active" | "Delayed" | "In Progress" | "In Testing" | "On Track" | "On Hold" | "Approved" | "Cancelled" | "Planning" | "Invoice";
    // projectGroup: mongoose.Schema.Types.ObjectId | null,
    completionTime: (string | null),
    // TaskAndIssuePrefix: (string | null),
    preRequisites: Types.ObjectId,
    category: string

}


interface IProject extends Document {
    userId: mongoose.Schema.Types.ObjectId
    projectId: string,
    projectName: string,
    accessibleClientId: Types.ObjectId[],
    description: (string | null);
    projectInformation: projectInformation
    // tasks: (number | null),
    // issues: (number | null),
    // phases: (number | null),
    completionPercentage: (number | null),
    // projectAccess: string,
    // taskLists: mongoose.Schema.Types.ObjectId[],
    materials: Types.ObjectId[]
    labours: Types.ObjectId[],
    materialsFullyApproved: "approved" | "rejected" | "pending"
    laboursFullyApproved: "approved" | "rejected" | "pending",
    organizationId: Types.ObjectId
    preRequiretiesCheckID: Types.ObjectId
}

const ProjectSchema: Schema<IProject> = new Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "UserModel"
    },
    projectId: {
        type: String,
        required: true,
        trim: true
    },
    projectName: {
        type: String,
        required: true,
    },
    accessibleClientId: {
        type: [Schema.Types.ObjectId],
        ref: "ClientModel",
        default: []
    },
    description: {
        type: String,
        default: null
    },
    projectInformation: {
        owner: {
            type: String,
            // required: true,
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
            type: Number,
            default: null
        },
        priority: {
            type: String,
            default: "none"
        },
        status: {
            type: String,
            default: "Active"
        },
        completionTime: {
            type: String,
            default: null
        },
        category: {
            type: String,
            default: null
        }
        // TaskAndIssuePrefix: {
        //     type: String,
        //     default: null
        // },
        // projectGroup: {
        //     type: mongoose.Schema.ObjectId,
        //     default: null,
        //     ref: "ProjectGroup"
        // },
    },
    // tasks: {
    //     type: Number,
    //     default: 0,
    // },
    // issues: {
    //     type: Number,
    //     default: 0,
    // },
    // phases: {
    //     type: Number,
    //     default: 0,
    // },
    completionPercentage: {
        type: Number,
        default: 0,
    },
    // projectAccess: {
    //     type: String,
    //     default:"private"
    // },
    // taskLists: [{
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'TaskModel'
    // }],
    materials: {
        type: [Schema.Types.ObjectId],
        ref: "MaterialListModel",
        default: []
    },
    labours: {
        type: [Schema.Types.ObjectId],
        ref: "LabourListModel",
        default: []
    },
    materialsFullyApproved: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    laboursFullyApproved: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "OrganizationModel",
        required: true
    },
    preRequiretiesCheckID: {
        type: Schema.Types.ObjectId,
        ref: "PreRequiretiesModel",
        default: null
    }
}, {
    timestamps: true
})

ProjectSchema.index({ projectName: 1, userId: 1 });

ProjectSchema.plugin(procurementLogger);


const ProjectModel = mongoose.model<IProject>("ProjectModel", ProjectSchema)

export default ProjectModel