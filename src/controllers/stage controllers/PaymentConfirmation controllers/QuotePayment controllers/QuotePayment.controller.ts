import { Request, Response } from "express";
import PaymentConfirmationModel, { IClientQuotesSelected } from "../../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";





export const getPaymentAllQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Project ID is required." });
        }

        const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });

        if (!paymentDoc) {
            return res.status(404).json({ ok: false, message: "Payment Confirmation stage not found." });
        }

        return res.status(200).json({
            ok: true,
            message: "Payment quotes fetched successfully.",
            data: paymentDoc?.quoteSelected || [],
        });

    } catch (err) {
        console.error("Error fetching payment schedule:", err);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};





export const getPaymentSingleQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, id } = req.params;

        if (!projectId || !id) {
            return res.status(400).json({ ok: false, message: "Project ID and Id is required." });
        }

        const paymentDoc = await PaymentConfirmationModel.findOne({ projectId })
            .populate({
                path: "quoteSelected.quoteId",   // 👈 this must match your schema field
                model: "QuoteVarientGenerateModel" // optional since you’re using refPath
            }); // 👈 nested populate


        if (!paymentDoc) {
            return res.status(404).json({ ok: false, message: "Payment Confirmation stage not found." });
        }

        let quote = paymentDoc?.quoteSelected.find((quote: IClientQuotesSelected) => (quote as any)?._id.toString() === id.toString())


        if (!quote) {
            return res.status(404).json({ ok: false, message: "Quotation not found." });
        }



        return res.status(200).json({
            ok: true,
            message: "Payment quotes fetched successfully.",
            data: quote || null,
        });

    } catch (err) {
        console.error("Error fetching payment quotiton:", err);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};

