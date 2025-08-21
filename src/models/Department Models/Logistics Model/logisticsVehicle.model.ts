import mongoose, { Schema } from "mongoose";

export interface ILogisticsVehicle {
  vehicleNumber: string;
  vehicleType: "truck" | "van" | "car" | "bike" | "tempo" | "container";
  capacity?: {
    weight?: number; // kg
    volume?: number; // cubic meters
  };
  driver?: {
    name?: string;
    phone?: string;
    licenseNumber?: string;
  };
  isAvailable?: boolean;
  currentLocation?: {
    address?: string;
    coordinates?: number[]; // [lng, lat]
  };
  driverCharge: number,
  maintenanceStatus?: "good" | "needs_service" | "in_service" | "out_of_order";
}

export const LogisticsVehicleSchema = new Schema<ILogisticsVehicle>({
  vehicleNumber: String,
  vehicleType: { type: String, enum: ["truck", "van", "car", "bike", "tempo", "container"] },
  capacity: {
    weight: Number,
    volume: Number
  },
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  driverCharge:{
    type:Number,
    default: 0
  },
  isAvailable: { type: Boolean, default: true },
  currentLocation: {
    address: String,
    coordinates: { type: [Number], index: "2dsphere" }
  },
  maintenanceStatus: {
    type: String,
    enum: ["good", "needs_service", "in_service", "out_of_order"],
    default: "good"
  }
}, {timestamps:true});

export const LogisticsVehicleModel = mongoose.model<ILogisticsVehicle>(
  "LogisticsVehicleModel",
  LogisticsVehicleSchema
);