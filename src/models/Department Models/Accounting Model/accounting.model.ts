import mongoose,{ Schema } from "mongoose";

const accountingTransactionSchema = new Schema({
  transactionNumber: {
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
  transactionType: {
    type: String,
    enum: ['quote', 'invoice', 'payment', 'expense', 'refund']
  },
  amount: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    maxLength: 3
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'sent', 'approved', 'paid', 'cancelled', 'overdue']
  },
  dueDate: Date,
  paymentTerms: String,
  notes: String,
  lineItems: [{
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
    taxRate: {
      type: Number,
      default: 0
    },
    category: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'
  },
  approvedAt: Date
}, {
  timestamps: true
});

const paymentLinkSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountingTransactionModel',
  },
  linkUrl: {
    type: String,
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'payu', 'phonepe']
  },
  gatewayPaymentId: String,
  amount: {
    type: Number,
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'expired', 'paid', 'cancelled']
  },
  expiresAt: Date,
  paidAt: Date
}, {
  timestamps: true
});
