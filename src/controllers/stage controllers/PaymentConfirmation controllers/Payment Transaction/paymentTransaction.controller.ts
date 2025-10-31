import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentConfirmationModel from "../../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import { Request, Response} from "express";
import { RoleBasedRequest } from "../../../../types/types";
import {Types} from "mongoose"

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const createPaymentConfirmationOrder = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const {clientId} = req.body

        const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
        if (!paymentDoc) {
            return res.status(404).json({ ok: false, message: "Payment confirmation not found." });
        }

        const amountInPaise = paymentDoc.totalAmount * 100; // Razorpay needs INR in paise

        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        // Save gatewayOrderId and status
        paymentDoc.paymentTransaction = {
            ...paymentDoc.paymentTransaction,
            clientId: clientId || "6852b99174f27430cffafd31", // make sure you pass it
            paymentGateway: "razorpay",
            gatewayOrderId: order.id,
            gatewayPaymentId: null,
            status: "created",
            amount: paymentDoc.totalAmount,
            currency: "INR",
            paidAt: null,
        };

        await paymentDoc.save();

        return res.status(200).json({
            ok: true,
            message: "Razorpay order created successfully.",
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
            },
        });

    } catch (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};



const verifyPaymentConfirmation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
        if (!paymentDoc) {
            return res.status(404).json({ ok: false, message: "Payment confirmation not found." });
        }

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

            // console.log("generatedSigneatrue", generated_signature)
            // console.log("razorpay signature", razorpay_signature)

            
        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ ok: false, message: "Payment verification failed." });
        }

        paymentDoc.paymentTransaction.status = "successful";
        paymentDoc.paymentTransaction.gatewayPaymentId = razorpay_payment_id;
        paymentDoc.paymentTransaction.paidAt = new Date();
        // paymentDoc.status = "completed";

        await paymentDoc.save();

        return res.status(200).json({
            ok: true,
            message: "Payment verified and marked successful.",
            data: paymentDoc.paymentTransaction,
        });

    } catch (err) {
        console.error("Error verifying Razorpay payment:", err);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};


const getPaymentTransaction = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
        if (!paymentDoc) {
            return res.status(404).json({ ok: false, message: "Payment confirmation not found." });
        }

        return res.status(200).json({
            ok: true,
            message: "Payment transaction fetched successfully.",
            data: {paymentTransaction:paymentDoc.paymentTransaction, totalAmount: paymentDoc.totalAmount },
        });

    } catch (err) {
        console.error("Error fetching payment transaction:", err);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};



export {
    createPaymentConfirmationOrder,
    verifyPaymentConfirmation,
    getPaymentTransaction,
}