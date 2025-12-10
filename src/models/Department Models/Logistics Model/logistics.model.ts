import mongoose, { Schema } from "mongoose";
import { Types, Document } from "mongoose";
import { ILogisticsVehicle, LogisticsVehicleSchema } from "./logisticsVehicle.model";


export interface IShipmentItem {
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  unit: string,
  totalCost: number,
}

export interface ILogisticsShipment {
  organizationId: Types.ObjectId;
  shipmentNumber: string;
  projectId: Types.ObjectId;
  // vehicleId?: Types.ObjectId;
  vehicleDetails: ILogisticsVehicle,
  shipmentType: "delivery" | "pickup" | "transfer";
  origin?: {
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    // coordinates?: number[];
  };
  destination?: {
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    // coordinates?: number[];
  };
  items?: IShipmentItem[];
  shipmentStatus?: "pending" | "assigned" | "pickedup" | "in_transit" | "delivered" | "cancelled";
  scheduledDate?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  // assignedTo?: Types.ObjectId;
  notes?: string;


  orderMaterialDeptNumber: string | null
  orderMaterialRefId: Types.ObjectId | null

  procurementDeptNumber: string | null
  procurementRefId: Types.ObjectId | null

  paymentDeptNumber: string | null,
  paymentRefId: Types.ObjectId | null,

  // currentLocation: {
  //   latitude: number,
  //   longitude: number,
  //   updatedAt: Date
  // },

  // lastLocationUpdate: Date,

  // eta: number,   // minutes

  // // trackingId: String,

  // locationHistory: [{
  //   latitude: number,
  //   longitude: number,
  //   timestamp: Date
  // }],

  // token: string,


  trackingLink: string
}


export const LogisticsShipmentSchema = new Schema<ILogisticsShipment>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },

  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
  shipmentNumber: { type: String, default: null },
  // shipmentType: { type: String, enum: ["delivery", "pickup", "transfer"] },
  vehicleDetails: { type: LogisticsVehicleSchema, default: null },
  origin: {
    address: { type: String, default: null },
    contactPerson: { type: String, default: null },
    contactPhone: { type: String, default: null },
    // coordinates: [Number]
  },
  destination: {
    address: { type: String, default: null },
    contactPerson: { type: String, default: null },
    contactPhone: { type: String, default: null },
    // coordinates: [Number]
  },
  items: [{
    name: String,
    quantity: Number,
    unit: String,
    totalCost: Number,
    weight: Number,
    description: String
  }],
  shipmentStatus: {
    type: String,
    enum: ["pending", "assigned", "pickedup", "in_transit", "delivered", "cancelled", null],
    default: "pending"
  },
  scheduledDate: { type: Date, default: null },
  actualPickupTime: { type: Date, default: null },
  actualDeliveryTime: { type: Date, default: null },
  notes: { type: String, default: null },








  orderMaterialDeptNumber: {
    type: String,   // used to store the refUniquePdf property value of the ordeing material's pdf
    default: null
  },

  orderMaterialRefId: {
    type: Schema.Types.ObjectId,
    ref: "OrderMaterialHistoryModel",
    default: null
  },



  procurementDeptNumber: {
    type: String,   // used to store the refUniquePdf property value of the ordeing material's pdf
    default: null
  },

  procurementRefId: {
    type: Schema.Types.ObjectId,
    ref: "ProcurementModelNew",
    default: null
  },

  paymentDeptNumber: {
    type: String,   // used to store the refUniquePdf property value of the ordeing material's pdf
    default: null
  },

  paymentRefId: {
    type: Schema.Types.ObjectId,
    ref: "PaymentMainAccountsModel",
    default: null
  },

  // trackingId: {
  //   type: String,
  //   default: null
  // },

  // currentLocation: {
  //   latitude: Number,
  //   longitude: Number,
  //   updatedAt: Date
  // },

  // lastLocationUpdate: {
  //   type: Date,
  //   default: null
  // },

  // eta: {
  //   type: Number,   // ETA in minutes
  //   default: null
  // },

  // locationHistory: [
  //   {
  //     latitude: { type: Number, },
  //     longitude: { type: Number, },
  //     timestamp: { type: Date, default: Date.now }
  //   }
  // ],
  // token: { type: String, default: null },

  trackingLink: { type: String, default: null }
}, { _id: true, timestamps: true });


export const LogisticsShipmentModel = mongoose.model<ILogisticsShipment>(
  "LogisticsShipmentModel",
  LogisticsShipmentSchema
);
