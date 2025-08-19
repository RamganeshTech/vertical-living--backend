import mongoose,{ Schema } from "mongoose";

const legalContractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientModel'
  },
  contractType: {
    type: String,
    enum: ['service_agreement', 'nda', 'employment', 'vendor_agreement', 'lease', 'other'],
  },
  title: {
    type: String,
  },
  description: String,
  parties: [{
    name: String,
    role: {
      type: String,
      enum: ['client', 'company', 'vendor', 'partner']
    },
    contactInfo: {
      email: String,
      phone: String,
      address: String
    }
  }],
  contractValue: {
    amount: Number,
    currency: { type: String, default: 'INR' }
  },
  startDate: Date,
  endDate: Date,
  renewalTerms: String,
  status: {
    type: String,
    enum: ['draft', 'under_review', 'approved', 'signed', 'active', 'expired', 'terminated'],
    default: 'draft'
  },
  documents: [{
    fileName: String,
    fileUrl: String,
    documentType: {
      type: String,
      enum: ['original_contract', 'amendment', 'addendum', 'termination']
    },
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
    }
  }],
  legalReviewer: {
    type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
  },
  reviewNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
  }
}, {
  timestamps: true
});
