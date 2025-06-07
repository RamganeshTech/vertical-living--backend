import { model, Schema, Types } from "mongoose";

interface ITaskItemApproval {
  taskItemId: Types.ObjectId;
  approved: 'pending' | 'approved' | 'rejected';
  feedback?: string | null;
}

interface ITaskApproval extends Document {
  clientId: Types.ObjectId;
  projectId: Types.ObjectId;
  taskListId: Types.ObjectId;
  approvedItems: ITaskItemApproval[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date | null;
}

const TaskItemApprovalSchema = new Schema<ITaskItemApproval>({
  taskItemId: { type: Schema.Types.ObjectId, required: true, ref: 'TaskModel' },
  approved: { type: String, enum:['pending', 'approved', 'rejected'], default: "pending" },
  feedback: { type: String, default: null }
}, { _id: true , timestamps:true});

const TaskApprovalSchema = new Schema<ITaskApproval>({
  clientId: { type: Schema.Types.ObjectId, ref: 'ClientModel', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ProjectModel', required: true },
  taskListId: { type: Schema.Types.ObjectId, ref: 'TaskListModel', required: true },
  approvedItems: { type: [TaskItemApprovalSchema], default: [] },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date }
}, { timestamps: true });

export const TaskApprovalModel = model<ITaskApproval>('TaskApprovalModel', TaskApprovalSchema);