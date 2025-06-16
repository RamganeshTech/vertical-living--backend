import { model, Schema, Types } from "mongoose";
import { Reminder } from "../task model/task.model";

interface PhaseIssues {
    projectId: Types.ObjectId
    phaseId: Types.ObjectId,
    issueId: string,
    issueName: string,
    reporter: String,
    createdAt: Date,
    status: "In Progress" | "To be Tested" | "Closed",
    assigne: string,
    dueDate: Date,
    tags: string[],
    severity: "none" | "show stopper" | "Critical" | "Minor" | "Major"
    issuecomments:Types.ObjectId,
}


interface issueExtraInformation {
    associatedTeam: string,
    reminder: Reminder,
    releasePhase: Types.ObjectId,
    affectedPhase: Types.ObjectId,
    flag: "internal" | "external",
    classification: "security" | "data loss" | "performance" | "crash/hang" | "other bug" | "feature(new)" | "enhancement"

}



const IssueSchema = new Schema<PhaseIssues>({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "ProjectModel"
    },
    issueId: {
        type: String
    },
    phaseId: { type: Schema.Types.ObjectId, ref: "PhaseModel" },
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
    severity: {
        type: String,
        enum: ["none", "show stopper", "Critical", "Minor", "Major"]
    },
    issuecomments:[{type: Schema.Types.ObjectId, ref:"IssueCommentModel"}]

})


const IssueModel = model("IssueModel", IssueSchema)

export default IssueModel;