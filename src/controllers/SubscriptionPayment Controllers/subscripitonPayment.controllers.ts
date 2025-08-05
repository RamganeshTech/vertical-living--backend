import { Request, Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import SubscriptionPaymentModel from "../../models/Subscription Model/subscriptionPayment.model";
import crypto from 'crypto';
import OrganizationModel from "../../models/organization models/organization.model";
import Razorpay from "razorpay";
import { SUBSCRIPTION_PLANS } from "../../constants/BEconstants";
import redisClient from "../../config/redisClient";


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const startPlanChange = async (req: AuthenticatedUserRequest, res: Response): Promise<any> => {
  try {
    const { newPlanType } = req.body;
    const user = req.user;

    const org = await OrganizationModel.findOne({ userId: user._id });
    if (!org) {
      return res.status(404).json({ ok: false, message: "Organization not found." });
    }

    if (!["basic", "enterprise", "advanced"].includes(newPlanType)) {
      return res.status(400).json({ ok: false, message: "Invalid plan type." });
    }

    if (newPlanType === org.planType) {
      return res.status(400).json({ ok: false, message: "You are already on this plan." });
    }

    const newPlan = (SUBSCRIPTION_PLANS as any)[newPlanType.toUpperCase()];

    if (!newPlan) {
      return res.status(400).json({ ok: false, message: "Invalid plan config." });
    }

    // ✅ Always create Razorpay order for plan change (upgrade or downgrade)
    const amountInPaise = newPlan.price * 100;

    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `planchange_${Date.now()}`,
    });

    await SubscriptionPaymentModel.create({
      organizationId: org._id,
      planType: newPlan.name,
      paymentGateway: "razorpay",
      gatewayOrderId: order.id,
      status: "created",
      amount: newPlan.price,
    });

   

    return res.status(200).json({
      ok: true,
      message: "Plan payment initiated",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};





const verifySubscriptionPayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await SubscriptionPaymentModel.findOne({
      gatewayOrderId: razorpay_order_id,
    }).populate("organizationId");

    if (!payment) {
      return res.status(404).json({ ok: false, message: "Payment not found." });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ ok: false, message: "Payment verification failed." });
    }

    payment.status = "successful";
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
    await payment.save();


    const org = payment.organizationId as any;

    const newPlan = (SUBSCRIPTION_PLANS as any)[payment.planType.toUpperCase()];
    org.planType = newPlan.name;
    org.planStatus = "active";
    org.planValidTill = new Date(Date.now() + newPlan.durationInDays * 24 * 60 * 60 * 1000);
    await org.save();

    
     await redisClient.setEx(
      `org:plan:${org.userId}`,   
      86400, // 1 day TTL, or longer
      JSON.stringify({
        planType: org.planType,
        planValidTill: org.planValidTill,
        planStatus: org.planStatus,
      })
    );

    return res.status(200).json({
      ok: true,
      message: "Payment verified and plan updated.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};




export {
    startPlanChange,
    verifySubscriptionPayment
}