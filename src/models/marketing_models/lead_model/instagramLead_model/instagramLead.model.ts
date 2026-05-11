import { Schema, model, Document, Types } from 'mongoose';

export interface IInstagramLead extends Document {
  organizationId: Types.ObjectId;
  senderId: string; // The unique PSID from Meta
  igUsername?: string;
  fullName?: string;
  lastMessageText?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstagramLeadSchema = new Schema<IInstagramLead>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "OrganizationModel", // Matches your existing multi-tenant ref
    required: true
  },
  senderId: { type: String, required: true, index: true },
  igUsername: { type: String },
  fullName: { type: String },
  lastMessageText: { type: String },
  status: { type: String, default: "New" },
}, { timestamps: true });

export const InstagramLeadModel = model<IInstagramLead>('InstagramLeadModel', InstagramLeadSchema);