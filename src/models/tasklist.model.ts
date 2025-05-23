import mongoose, { Schema, Document } from "mongoose";

interface ITaskList extends Document {
  title: string;
  projectId: mongoose.Types.ObjectId;
  tasks: mongoose.Types.ObjectId[];
}

const TaskListSchema = new Schema<ITaskList>({
  title: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ProjectModel', required: true },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'TaskModel'}]
});

export const TaskListModel = mongoose.model<ITaskList>('TaskListModel', TaskListSchema);
