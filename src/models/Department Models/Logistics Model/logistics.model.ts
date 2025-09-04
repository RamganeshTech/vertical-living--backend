import mongoose, { Schema } from "mongoose";
import { Types, Document } from "mongoose";
import { ILogisticsVehicle, LogisticsVehicleSchema } from "./logisticsVehicle.model";


export interface IShipmentItem {
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
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
  status?: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";
  scheduledDate?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  // assignedTo?: Types.ObjectId;
  notes?: string;
}

export interface ILogisticsMain extends Document {
  organizationId: Types.ObjectId;
  vehicles: Types.ObjectId[];
  projectShipments: {
    projectId: Types.ObjectId,
    shipments: Types.ObjectId[],
  }[]
}


export const LogisticsShipmentSchema = new Schema<ILogisticsShipment>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
  shipmentNumber: String,
  // shipmentType: { type: String, enum: ["delivery", "pickup", "transfer"] },
  vehicleDetails: { type:LogisticsVehicleSchema, default: null },
  origin: {
    address: String,
    contactPerson: String,
    contactPhone: String,
    // coordinates: [Number]
  },
  destination: {
    address: String,
    contactPerson: String,
    contactPhone: String,
    // coordinates: [Number]
  },
  items: [{
    name: String,
    quantity: Number,
    weight: Number,
    description: String
  }],
  status: {
    type: String,
    enum: ["pending", "assigned", "in_transit", "delivered", "cancelled"],
    default: "pending"
  },
  scheduledDate: Date,
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  notes: String
}, { _id: true, timestamps: true });



export const LogisticsShipmentModel = mongoose.model<ILogisticsShipment>(
  "LogisticsShipmentModel",
  LogisticsShipmentSchema
);

// const LogisticsMainSchema = new Schema<ILogisticsMain>({
//   organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
//   vehicles: { type: [Schema.Types.ObjectId], ref: "LogisticsVehicleModel", default: [] },
//   projectShipments: [
//     {
//       projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
//       shipments: [{ type: Schema.Types.ObjectId, ref: "LogisticsShipmentModel" }] // references, not embedded
//     }
//   ]
// }, { timestamps: true });

// export const LogisticsMainModel = mongoose.model<ILogisticsMain>(
//   "LogisticsMainModel",
//   LogisticsMainSchema
// );


