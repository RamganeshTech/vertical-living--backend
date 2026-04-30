import { Schema, model, Document, Types } from 'mongoose';

export interface IWhatsAppLead extends Document {
  organizationId: Types.ObjectId;
  phoneNumber: string;
  customerName?: string;
  initialInquiry?: string;
  waMessageId?: string; // To track specific message reference
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppLeadSchema = new Schema<IWhatsAppLead>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "OrganizationModel",
    required: true
  },
  phoneNumber: { type: String, required: true, index: true },
  customerName: { type: String },
  initialInquiry: { type: String },
  waMessageId: { type: String },
  status: { type: String, default: "Unread" },
}, { timestamps: true });

export const WhatsAppLeadModel = model<IWhatsAppLead>('WhatsAppLeadModel', WhatsAppLeadSchema);