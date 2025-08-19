import mongoose,{ Schema } from "mongoose";

const departmentActivityLogSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DepartmentModel',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  action: {
    type: String,
    // e.g., 'created_invoice', 'approved_po', 'scheduled_delivery'
  },
  entityType: {
    type: String,
    // e.g., 'invoice', 'purchase_order', 'shipment'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  description: String,
  
}, {timestamps:true});