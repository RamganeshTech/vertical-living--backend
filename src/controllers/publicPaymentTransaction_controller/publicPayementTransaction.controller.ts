import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import PublicPaymentTransaction, { ICreateOrderRequest, IVerifyPaymentRequest } from '../../models/publicPaymentTransaction_model/publicPaymentTransaction.model';
// import { PublicPaymentTransaction } from '../models/PublicPaymentTransaction';

import dotenv from "dotenv"
dotenv.config()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Use a constant Org ID from .env for security
const VERTICAL_LIVING_ORG_ID = process.env.VERTICAL_LIVING_ORG_ID;

export const createOrderPublicTransaction = async (req: Request<{}, {}, ICreateOrderRequest>, res: Response):Promise<any> => {
  try {
    const { amount, customerDetails } = req.body;

    console.log("getting caled ")

    const options:any = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `v_living_${Date.now()}`,
      notes: {
        organizationId: VERTICAL_LIVING_ORG_ID,
        customerName: customerDetails.name
      }
    };

    const order = await razorpay.orders.create(options);

    // Create the transaction record in your DB
    await PublicPaymentTransaction.create({
      organizationId: VERTICAL_LIVING_ORG_ID,
      razorpay_order_id: order.id,
      amount: amount,
      customerDetails: {
        ...customerDetails,
        address: null
      },
      status: 'pending',
      metadata: {
        sourceDomain: 'theverticalliving.com',
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      ok: true,
      order_id: order.id,
      amount: order.amount,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

export const verifyPaymentPublicTransaction = async (req: Request<{}, {}, IVerifyPaymentRequest>, res: Response):Promise<any> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Update the existing transaction record
      const transaction = await PublicPaymentTransaction.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        { 
          status: 'captured', 
          razorpay_payment_id: razorpay_payment_id 
        },
        { new: true }
      );

      return res.status(200).json({ 
        ok: true, 
        message: "Payment verified successfully",
        transactionId: transaction?._id 
      });
    } else {
      return res.status(400).json({ ok: false, message: "Invalid signature" });
    }
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

export const getAllOrgTransactions = async (req: Request, res: Response):Promise<any> => {
  try {
    // In a real CRM, you'd get this ID from the authenticated user's session
    const { organizationId } = req.query; 

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Organization ID is required" });
    }

    // Fetch transactions, populate plan details if needed, and sort by newest first
    const transactions = await PublicPaymentTransaction.find({ 
      organizationId,
    //   status: 'captured' // Only show successful payments
    })
    .sort({ createdAt: -1 });

    res.status(200).json({ ok: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};
