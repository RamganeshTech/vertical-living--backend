import { Schema, model, Document } from 'mongoose';

export interface ITaskTemplate extends Document {
  taskText: string; // Main task title/description
  steps: string[];  // Subtasks (list of steps)
  embedding: number[];
}

const TaskTemplateSchema = new Schema<ITaskTemplate>({
  taskText: { type: String, required: true },
  steps: [{ type: String, required: true }],
  embedding: [{ type: Number, required: true }]
}, {
  timestamps: true,
});

const TaskTemplateModel = model<ITaskTemplate>('TaskTemplateModel', TaskTemplateSchema);

export default TaskTemplateModel;