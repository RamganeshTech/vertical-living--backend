import mongoose,{ Schema } from "mongoose";

const factoryProductionOrderSchema = new mongoose.Schema({
  productionOrderNumber: {
    type: String,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel',
  },
  orderType: {
    type: String,
    enum: ['manufacturing', 'assembly', 'packaging', 'customization'],
  },
  items: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    productName: String,
    specifications: String,
    quantityOrdered: Number,
    quantityProduced: { type: Number, default: 0 },
    unitCost: Number,
    totalCost: Number
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'quality_check', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTeam: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
    },
    role: String
  }],
  scheduledStartDate: Date,
  scheduledEndDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  qualityCheckStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'rework_needed']
  },
  qualityNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'
  }
}, {
  timestamps: true
});