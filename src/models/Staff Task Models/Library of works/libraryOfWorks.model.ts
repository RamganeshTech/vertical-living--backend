import { model, Schema, Types } from "mongoose";

// Subtask Interface
export interface ISubtask {
  title: string;
//   description?: string;
}

// Task Interface
export interface ITask {
    title: string;
    // description: string | null;
    // category: string | null;
    subtasks: ISubtask[];
    estimatedTimeInMinutes?: number;
}

// WorkLibrary Interface
export interface IWorkLibrary {
    organizationId: Types.ObjectId
  workName: string;
  description: string | null;
  tags: string[] | null;
  tasks: ITask[];
}


const SubtaskSchema = new Schema<ISubtask>({
  title: { type: String, default: null },
},{_id:true});



const TaskSchema = new Schema<ITask>({
  title: { type: String, default: null },
//   description: { type: String, default: null },
//   category: { type: String, default: null },
  subtasks: { type: [SubtaskSchema], default: [] },
  estimatedTimeInMinutes: { type: Number, default: null }
},{_id:true});

const WorkLibrarySchema = new Schema<IWorkLibrary>({
    organizationId: {type:Schema.Types.ObjectId, default: null},
  workName: { type: String, default: null },
  description: { type: String, default: null },
  tags: { type: [String], default: null },
  tasks: { type: [TaskSchema], default: [] }
}, {timestamps:true});

export const WorkLibraryModel = model<IWorkLibrary>('WorkLibrary', WorkLibrarySchema);


