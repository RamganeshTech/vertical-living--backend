import { Request, Response } from "express";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";


export const getAllClientQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { projectId, createdAt, quoteNo } = req.query;
        // Optional: Validate inputs
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Invalid organizationId" });
        }


        const filters: any = { organizationId };

        // ✅ Add project filter (optional)
        if (projectId) {
            filters.projectId = projectId;
        }

        // ✅ Add quote number search (partial match)
        if (quoteNo) {
            const q = String(quoteNo).trim();
            filters.quoteNo = { $regex: q.replace(/Q-/, ''), $options: 'i' };
        }

        // ✅ Add createdAt filter (match same day)
        if (createdAt) {
            const selectedDate = new Date(createdAt as string); // "yyyy-mm-dd"
            selectedDate.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setDate(endOfDay.getDate() + 1); // next day start

            filters.createdAt = {
                $gte: selectedDate,
                $lt: endOfDay,
            };
        }


        const quotes = await QuoteVarientGenerateModel.find(filters).populate("projectId");

        return res.status(200).json({
            ok: true,
            message: "quotes fetched successfully",
            data: quotes,
        });

    } catch (error: any) {
        console.error("Error fetching quotes", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch quotes entries",
            error: error.message,
        });
    }
};



export const getSingleClientQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, id } = req.params;

        // Optional: Validate inputs
        if (!organizationId || !id) {
            return res.status(400).json({ ok: false, message: "Invalid Ids" });
        }

        const quote = await QuoteVarientGenerateModel.findOne({
            organizationId, _id: id
        }).populate('projectId')

        return res.status(200).json({
            ok: true,
            message: "quote fetched",
            data: quote,
        });

    } catch (error: any) {
        console.error("Error fetching quotes", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch quotes entries",
            error: error.message,
        });
    }
};



    export const storeQuoteToPaymentStage = async (req: Request, res: Response): Promise<any> => {
        try {
            const { organizationId, id } = req.params;

            // Optional: Validate inputs
            if (!organizationId || !id) {
                return res.status(400).json({ ok: false, message: "Invalid Ids" });
            }

            const quote = await QuoteVarientGenerateModel.findOne({
                organizationId, _id: id
            }).populate('projectId')


            if (!quote) {
                return res.status(404).json({ messaage: "quote not found", ok: false })
            }


            const payment = await PaymentConfirmationModel.findOneAndUpdate({ projectId: quote?.projectId }, {
                $push: {
                    quoteSelected: {
                        quoteId: quote._id,
                        quoteModel: "QuoteVarientGenerateModel",
                        quoteNo: quote.quoteNo,
                        status: "selected"
                    }
                },
                $set: {
                    totalAmount: quote.grandTotal,
                },
            }, { returnDocument: "after" })

            if (!payment) {
                return res.status(404).json({ messaage: "failed to send to payment stage", ok: false })
            }

            return res.status(200).json({
                ok: true,
                message: "payment sent to payment stage",
                data: payment,
            });

        } catch (error: any) {
            console.error("Error fetching quotes", error);
            return res.status(500).json({
                ok: false,
                message: "Failed to fetch quotes entries",
                error: error.message,
            });
        }
    };





export const toggleBlurring = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, id } = req.params;
        const { isBlured } = req.body
        // Optional: Validate inputs
        if (!organizationId || !id) {
            return res.status(400).json({ ok: false, message: "Invalid Ids" });
        }

        const quote = await QuoteVarientGenerateModel.findOneAndUpdate({
            organizationId, _id: id
        }, { $set: { isBlured: isBlured } }, { returnDocument: "after" })


        if (!quote) {
            return res.status(404).json({ messaage: "quote not found", ok: false })
        }

        return res.status(200).json({
            ok: true,
            message: "payment sent to payment stage",
            data: quote,
        });

    } catch (error: any) {
        console.error("Error fetching quotes", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch quotes entries",
            error: error.message,
        });
    }
};