import { model, Schema, Types } from "mongoose";
import { Comments } from "../task.model";

interface issueComments extends Comments {
    issueId: Types.ObjectId
}

const issueCommentSchema = new Schema<issueComments>({
    issueId: { type: Schema.Types.ObjectId, ref: "IssueModel" },
    commentorName: {
        type: String,
        required:true
    },
    comment: {
        type: String,
        required:true
    },
    commentedTime: {
        type: Date,
        default: Date.now()
    },
})


const IssueCommentModel = model("IssueCommentModel", issueCommentSchema)


export default IssueCommentModel;