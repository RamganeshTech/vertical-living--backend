
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHub extends Document {
  organizationId: Types.ObjectId;
  city: string;
  latitude: number;
  longitude: number;
  startingPincode: string;
  endingPincode: string;
  materialPercentage: number;
  labourPercentage: number;
  isActive: boolean;
}

const hubSchema = new Schema<IHub>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "OrganizationModel",
      required: true,
      index: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },

    startingPincode: {
      type: String,
      default: null
    },

    endingPincode: {
      type: String,
      default: null
    },

    materialPercentage: {
      type: Number,
      default: 0,
    },

    labourPercentage: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

hubSchema.index({ organizationId: 1, startingPincode: 1, endingPincode: 1 });

const HubModel = mongoose.model<IHub>("HubModel", hubSchema);

export default HubModel;
