import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISubscriptionPayment extends Document {
  organizationId: Types.ObjectId;
  planType: "basic" | "enterprise" | "advanced";
  paymentGateway: "razorpay";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status: "created" | "successful" | "failed";
  amount: number;
  currency: string;
  paidAt?: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "OrganizationModel",
      required: true,
    },
    planType: {
      type: String,
      enum: ["basic", "enterprise", "advanced"],
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["razorpay"],
      required: true,
      default: "razorpay",
    },
    gatewayOrderId: {
      type: String,
      required: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["created", "successful", "failed"],
      default: "created",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const SubscriptionPaymentModel = mongoose.model<ISubscriptionPayment>(
  "SubscriptionPaymentModel",
  SubscriptionPaymentSchema
);

export default SubscriptionPaymentModel;

