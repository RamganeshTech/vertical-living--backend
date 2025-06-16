// models/phaseComment.model.ts
import mongoose, { Schema } from "mongoose";
import { Comments } from "../task model/task.model";

export interface PhaseComment extends Comments {
  phaseId: mongoose.Schema.Types.ObjectId;
}

const PhaseCommentSchema = new Schema<PhaseComment>({
  phaseId: { type: Schema.Types.ObjectId, ref: "PhaseModel", required: true },
  commentorName: { type: String, required: true },
  comment: { type: String, required: true },
  commentedTime: { type: Date, default: Date.now },
});

export const PhaseCommentModel = mongoose.model("PhaseCommentModel", PhaseCommentSchema);
