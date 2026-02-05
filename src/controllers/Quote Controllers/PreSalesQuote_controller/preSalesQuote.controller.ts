import { Request, Response } from "express";
// import { PreSalesQuoteModel } from "../models/PreSalesQuote.model";
import mongoose from "mongoose";
import { PreSalesQuoteModel } from "../../../models/preSalesQuote_model/preSalesQuote.model";

/**
 * CREATE: Initialize a new quote
 * Only requires organizationId and mainQuoteName
 */
export const createPreSalesQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, mainQuoteName } = req.body;

        if (!organizationId || !mainQuoteName) {
            return res.status(400).json({ ok: false, message: "Organization ID and Quote Name are required" });
        }

        const newQuote = new PreSalesQuoteModel({
            organizationId,
            mainQuoteName,
            // status: "draft"
        });

        await newQuote.save()

        return res.status(201).json({
            ok: true,
            message: "Pre-sales quote initialized successfully",
            data: newQuote,
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Internal server error", error: error.message });
    }
};

/**
 * GET ALL: Retrieve list with search, status filter, and pagination
 */
export const getAllPreSalesQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.query; // Ensure this is passed from frontend
        const { search, status, page = 1, limit = 20 } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId as string) };

        // Search logic for Quote No, Client Name, or Main Quote Name
        if (search) {
            query.$or = [
                { quoteNo: { $regex: search, $options: "i" } },
                { clientName: { $regex: search, $options: "i" } },
                { mainQuoteName: { $regex: search, $options: "i" } },
            ];
        }

        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const data = await PreSalesQuoteModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await PreSalesQuoteModel.countDocuments(query);

        return res.status(200).json({
            ok: true,
            data,
            page: Number(page),
            hasMore: total > skip + data.length,
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Failed to fetch quotes", error: error.message });
    }
};

/**
 * GET SINGLE: Fetch one quote by ID
 */
export const getSinglePreSalesQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;

        const quote = await PreSalesQuoteModel.findById(quoteId);

        if (!quote) {
            return res.status(404).json({ ok: false, message: "Quote not found" });
        }

        return res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error fetching quote", error: error.message });
    }
};

/**
 * EDIT: Update full configuration and client details
 */
export const updatePreSalesQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;
        const {
           
            clientName,
            phone,
            email,
            location,
            carpetArea,
            bhk,
            finishTier,
            config,
            totalAmount,
            status
        } = req.body;

        const updatedQuote = await PreSalesQuoteModel.findByIdAndUpdate(
            quoteId,
            {
                $set: {
                    clientName,
                    phone,
                    email,
                    location,
                    carpetArea,
                    bhk,
                    finishTier,
                    config,
                    totalAmount,
                    status,
                }
            },
            { new: true }
        );

        if (!updatedQuote) {
            return res.status(404).json({ ok: false, message: "Quote not found to update" });
        }

        return res.status(200).json({
            ok: true,
            message: "Quote updated successfully",
            data: updatedQuote,
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Update failed", error: error.message });
    }
};

/**
 * DELETE: Remove a quote
 */
export const deletePreSalesQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;

        const deletedQuote = await PreSalesQuoteModel.findByIdAndDelete(quoteId);

        if (!deletedQuote) {
            return res.status(404).json({ ok: false, message: "Quote not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Quote deleted successfully"
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Deletion failed", error: error.message });
    }
};