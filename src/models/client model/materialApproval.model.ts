import { model, Schema, Types } from "mongoose";

interface IMaterialItemApproval {
  materialItemId: Types.ObjectId;
  approved: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

interface IMaterialApproval extends Document {
  clientId: Types.ObjectId;
  projectId: Types.ObjectId;
  materialListId: Types.ObjectId;
  approvedItems: IMaterialItemApproval[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
}

const MaterialItemApprovalSchema = new Schema<IMaterialItemApproval>({
  materialItemId: { type: Schema.Types.ObjectId, required: true, ref: 'MaterialEstimateModel' },
  approved: { type: String, enum:['pending', 'approved', 'rejected'], default: "pending" },
  feedback: { type: String, default: null }
}, { _id: true , timestamps:true});

const MaterialApprovalSchema = new Schema<IMaterialApproval>({
  clientId: { type: Schema.Types.ObjectId, ref: 'ClientModel', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ProjectModel', required: true },
  materialListId: { type: Schema.Types.ObjectId, ref: 'MaterialListModel', required: true },
  approvedItems: { type: [MaterialItemApprovalSchema], default: [] },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date }
}, { timestamps: true });

export const MaterialApprovalModel = model<IMaterialApproval>('MaterialApprovalModel', MaterialApprovalSchema);
