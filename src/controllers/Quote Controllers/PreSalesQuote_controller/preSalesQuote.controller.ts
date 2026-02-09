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



export const updatePreSalesQuoteName = async (req:Request, res:Response): Promise<any>  => {
    try {
        const { quoteId } = req.params;
        const { mainQuoteName } = req.body;

        if (!quoteId) {
            return res.status(400).json({
                ok: false,
                message: "Quote ID (quoteId) is required"
            });
        }

        if (!mainQuoteName || !mainQuoteName.trim()) {
            return res.status(400).json({
                ok: false,
                message: "mainQuoteName is required"
            });
        }

        // 1️⃣ Find existing quote
        const existingQuote = await PreSalesQuoteModel.findByIdAndUpdate(quoteId, {$set: {mainQuoteName: mainQuoteName}},  { new: true } );

        if (!existingQuote) {
            return res.status(404).json({
                ok: false,
                message: "Quote not found"
            });
        }


        return res.status(200).json({
            ok: true,
            message: "Quote name updated successfully",
            data: existingQuote
        });

    } catch (error:any) {
        console.error("Update PreSales Quote Name Error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};




/**
 * GET ALL: Retrieve list with search, status filter, and pagination
 */
export const getAllPreSalesQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.query; // Ensure this is passed from frontend
        const { search, status, page = 1, limit = 20, startDate, endDate } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        const query: any = { organizationId: new mongoose.Types.ObjectId(organizationId as string) };


        // 1. ADD DATE FILTER LOGIC HERE
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                // Set to start of the day (00:00:00)
                query.createdAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                // Set to end of the day (23:59:59) to include today's results
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }


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

            clientData,
            projectDetails,
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
                    clientData,
                    projectDetails,
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




//  COPY OF THE CONTRLLER

export const clonePreSalesQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;

        if (!quoteId) {
            return res.status(400).json({
                ok: false,
                message: "Quote ID (quoteId) is required"
            });
        }

        // 1️⃣ Find existing quote
        const sourceQuote = await PreSalesQuoteModel.findById(quoteId).lean();

        if (!sourceQuote) {
            return res.status(404).json({
                ok: false,
                message: "Quote not found"
            });
        }

  // 2️⃣ Determine Root Name
        const currentName = sourceQuote.mainQuoteName || "Quote";
        let rootName = currentName;

        if (currentName.startsWith("Copy of ")) {
            rootName = currentName
                .replace(/^Copy of /, "")
                .replace(/ \(\d+\)$/, "");
        }

        // 3️⃣ Find existing copies
        const escapedRoot = rootName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regex = new RegExp(
            `^Copy of ${escapedRoot}(?: \\((\\d+)\\))?$`
        );

        const existingCopies = await PreSalesQuoteModel.find({
            organizationId: sourceQuote.organizationId,
            mainQuoteName: { $regex: regex }
        }).select("mainQuoteName");

        // 4️⃣ Calculate next number
        let nextNumber = 0;

        if (existingCopies.length > 0) {
            const numbers = existingCopies.map(c => {
                const match = c.mainQuoteName?.match(/\((\d+)\)$/);
                return match ? parseInt(match[1]) : 0;
            });

            nextNumber = Math.max(...numbers) + 1;
        }

        // 5️⃣ Format new name
        let newQuoteName = "";

        if (existingCopies.length === 0) {
            newQuoteName = `Copy of ${rootName}`;
        } else {
            newQuoteName = `Copy of ${rootName} (${nextNumber})`;
        }

        // 6️⃣ Remove restricted fields
        const {
            _id,
            quoteNo,
            createdAt,
            updatedAt,
            __v,
            ...quoteData
        } = sourceQuote;

        // 7️⃣ Apply new name & reset status
        quoteData.mainQuoteName = newQuoteName;
        quoteData.status = "draft";
        // 3️⃣ Create new quote (this will trigger pre-save hook)
        const newQuote = new PreSalesQuoteModel(quoteData);
        await newQuote.save()

        return res.status(201).json({
            ok: true,
            message: "Pre-sales quote cloned successfully",
            data: newQuote
        });

    } catch (error:any) {
        console.error("Clone PreSales Quote Error:", error);
        return res.status(500).json({
            ok: false,
            message: error?.message
        });
    }
};
