import mongoose, { Schema, Document, Types } from 'mongoose';

interface IClientApproval extends Document {
  clientId: Types.ObjectId;
  projectId: Types.ObjectId;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  approvedAt?: Date;
}

const ClientApprovalSchema = new Schema<IClientApproval>({
  clientId: { type: Schema.Types.ObjectId, ref: 'ClientModel', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ProjectModel', required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  feedback: { type: String },
  approvedAt: { type: Date },
}, { timestamps: true });

export const ClientApprovalModel = mongoose.model<IClientApproval>('ClientApprovalModel', ClientApprovalSchema);
