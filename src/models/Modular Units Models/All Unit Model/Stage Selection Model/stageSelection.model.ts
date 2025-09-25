import mongoose, { Schema, Document } from "mongoose";

export interface IStageSelection extends Document {
  projectId: mongoose.Types.ObjectId;
  mode: "Modular Units" | "Manual Flow";

}

const StageSelectionSchema: Schema = new Schema<IStageSelection>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "ProjectModel",
    
  },
  mode: {
    type: String,
    default:null
  },
}, { timestamps: true });

// export const StageSelectionModel = mongoose.model<IStageSelection>(
//   "StageSelection",
//   StageSelectionSchema
// );



