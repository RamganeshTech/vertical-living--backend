import { model, Schema, Types } from "mongoose";

interface ILabourItemApproval {
  labourItemId: Types.ObjectId;
  approved: 'pending' | 'approved' | 'rejected';
  feedback?: string | null;
}

interface ILabourApproval extends Document {
  clientId: Types.ObjectId;
  projectId: Types.ObjectId;
  labourListId: Types.ObjectId;
  approvedItems: ILabourItemApproval[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date | null;
}

const LabourItemApprovalSchema = new Schema<ILabourItemApproval>({
  labourItemId: { type: Schema.Types.ObjectId, required: true, ref: 'LabourEstimateModel' },
  approved: { type: String, enum:['pending', 'approved', 'rejected'], default: "pending" },
  feedback: { type: String, default: null }
}, { _id: true , timestamps:true});

const LabourApprovalSchema = new Schema<ILabourApproval>({
  clientId: { type: Schema.Types.ObjectId, ref: 'ClientModel', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ProjectModel', required: true },
  labourListId: { type: Schema.Types.ObjectId, ref: 'LabourListModel', required: true },
  approvedItems: { type: [LabourItemApprovalSchema], default: [] },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date }
}, { timestamps: true });

export const LabourApprovalModel = model<ILabourApproval>('LabourApprovalModel', LabourApprovalSchema);
