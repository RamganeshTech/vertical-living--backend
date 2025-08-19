import mongoose,{ Schema } from "mongoose";

const procurementVendorSchema = new Schema({
  vendorCode: {
    type: String,
  },
  companyName: {
    type: String,
  },
  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  businessInfo: {
    gstNumber: String,
    panNumber: String,
    businessType: {
      type: String,
      enum: ['manufacturer', 'supplier', 'service_provider', 'contractor']
    },
    yearsInBusiness: Number
  },
  categories: [String], // Materials/services they provide
  paymentTerms: {
    creditDays: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'online']
    }
  },
  rating: {
    overall: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    pricing: { type: Number, min: 1, max: 5 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  }
}, {
  timestamps: true
});

const procurementPurchaseOrderSchema = new Schema({
  poNumber: {
    type: String,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementVendorModel',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  items: [{
    
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "items.refModel", // dynamic reference
        },
        refModel: {
          type: String,
          enum: ["SelectedModularUnitModel", "SelectedExternalModel"], // allowed collections
        },
    description: String,
    specification: String,
    quantity: { type: Number, required: true },
    unit: String,
    unitPrice: Number,
    totalPrice: Number,
    deliveryDate: Date
  }],
  totalAmount: Number,
  taxAmount: Number,
  grandTotal: Number,
  deliveryAddress: {
    address: String,
    contactPerson: String,
    contactPhone: String
  },
  paymentTerms: String,
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent_to_vendor', 'confirmed', 'partially_delivered', 'delivered', 'cancelled'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  notes: String
}, {
  timestamps: true
});