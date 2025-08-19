import mongoose,{ Schema } from "mongoose";

const logisticsVehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
  },
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'car', 'bike', 'tempo', 'container']
  },
  capacity: {
    weight: Number, // in KG
    volume: Number  // in cubic meters
  },
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  maintenanceStatus: {
    type: String,
    enum: ['good', 'needs_service', 'in_service', 'out_of_order'],
    default: 'good'
  }
}, {
  timestamps: true
});

const logisticsShipmentSchema = new mongoose.Schema({
  shipmentNumber: {
    type: String,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectModel'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogisticsVehicleModel'
  },
  shipmentType: {
    type: String,
    enum: ['delivery', 'pickup', 'transfer'],
  },
  origin: {
    address: String,
    contactPerson: String,
    contactPhone: String,
    coordinates: [Number]
  },
  destination: {
    address: String,
    contactPerson: String,
    contactPhone: String,
    coordinates: [Number]
  },
  items: [{
    name: String,
    quantity: Number,
    weight: Number,
    description: String
  }],
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  scheduledDate: Date,
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
  },
  notes: String
}, {
  timestamps: true
});