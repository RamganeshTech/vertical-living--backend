import mongoose, { model, Schema } from "mongoose";

export interface PhaseTaskList {
    phaseId: Schema.Types.ObjectId;
    taskListName: string;
    tags: string[],
    releaseNotes: string[], //used to store the 
    taskId: Schema.Types.ObjectId[]
}

const PhaseTaskListSchema = new Schema<PhaseTaskList>({
    phaseId: { type: Schema.Types.ObjectId, ref: "PhaseModel" },
    taskListName: String,
    tags: [String],
    releaseNotes: [String], //used to store the 
    taskId: [{ type: Schema.Types.ObjectId, ref: "PhaseTaskModel" }]
})

const PhaseTaskListModel = model('PhaseTaskListModel', PhaseTaskListSchema)

export default PhaseTaskListModel;