import { Schema, model, Document, Types } from 'mongoose';

export interface IMetaAdLead extends Document {
  organizationId: Types.ObjectId;
  metaLeadId: string; // Unique ID from Meta Ads
  formName?: string;
  adName?: string;
  adId?: string;
  formFields: Record<string, string>; // Dynamic fields from the ad form
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const MetaAdLeadSchema = new Schema<IMetaAdLead>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "OrganizationModel",
    required: true
  },
  metaLeadId: { type: String, required: true, unique: true },
  formName: { type: String },
  adName: { type: String },
  adId: { type: String },
  formFields: {
    type: Map,
    of: String,
    default: {}
  },
  status: { type: String, default: "Qualified" },
}, { timestamps: true });

export const MetaAdLeadModel = model<IMetaAdLead>('MetaAdLeadModel', MetaAdLeadSchema);