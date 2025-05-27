import { model, Schema, Types } from "mongoose";


interface PhaseTaskInformation {
    phaseTaskListId: Types.ObjectId
    taskName: string,
    owner: string
    tags: string[]
    startDate: (Date | null)
    endDate: (Date | null)
    dueDate: (Date | null)
    duration: (Date | null)
    priority: "none" | "Low" | "Medium" | "High"
    completionPercentage: number,
}

const PhaseSingleTaskSchema = new Schema<PhaseTaskInformation>({
    phaseTaskListId: { 
        type: Schema.Types.ObjectId, 
        ref: "PhaseTaskListModel" 
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
        enum: ["none", "Low", "Medium", "High"],
        default: "none"
    },
    completionPercentage: {
        type: Number,
        default: 0
    },
})

const PhaseSingleTaskModel = model("PhaseSingleTaskModel", PhaseSingleTaskSchema)

export default PhaseSingleTaskModel;