import mongoose from "mongoose";
import { Schema } from "mongoose";


import { Document, Types } from 'mongoose';

export interface IPublicPaymentTransaction extends Document {
  organizationId: Types.ObjectId | null;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount?: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed';
  customerDetails: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  metadata: {
    sourceDomain: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrderRequest {
  amount: number; // Final amount from frontend (or validated against a Plan)
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface IVerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}


const PublicTransactionSchema = new Schema<IPublicPaymentTransaction>({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OrganizationModel', 
    default: null,
  },
  razorpay_order_id: { type: String,  },
  razorpay_payment_id: { type: String },
  amount: { type: Number,  },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed'], 
    default: 'pending' 
  },
  customerDetails: {
    name: {type: String, default:null},
    email: {type: String, default:null},
    phone: {type: String, default:null},
    address: {type: String, default:null},
  },
  metadata: {
    sourceDomain: { type: String, default: 'theverticalliving.com' },
    ipAddress: String
  }
}, { timestamps: true });

const PublicPaymentTransaction = mongoose.model('PublicPaymentTransaction', PublicTransactionSchema);

export default PublicPaymentTransaction