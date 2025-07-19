import mongoose, { Schema, Document } from "mongoose";

export interface IStageSelection extends Document {
  projectId: mongoose.Types.ObjectId;
  mode: "modular-units" | "material-flow";

}

const StageSelectionSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "ProjectModel",
    
  },
  mode: {
    type: String,
    default:null
  },
}, { timestamps: true });

export const StageSelectionModel = mongoose.model<IStageSelection>(
  "StageSelection",
  StageSelectionSchema
);



