import { Request, Response } from 'express';
// import InternalQuoteEntryModel from '../models/MaterialQuote'; // Adjust path
import mongoose from 'mongoose';
import InternalQuoteEntryModel from '../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model';
import { generateNextQuoteNumber } from '../Quote Varaint Controller/QuoteVariant.controller';

/**
 * 1. INITIALIZE MAIN QUOTE
 * Triggered by the first popup (Project, Category, Name)
 */
export const createMainInternalQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId, mainQuoteName, quoteCategory } = req.body;

        // 1. Mandatory Field Validation
        if (!organizationId || !projectId || !mainQuoteName || !quoteCategory) {
            return res.status(400).json({
                ok: false,
                message: "Missing mandatory fields: organizationId, projectId, mainQuoteName, and quoteCategory are required."
            });
        }


        const quoteNumber = await generateNextQuoteNumber(organizationId)

        // 2. Document Creation
        const newQuote = new InternalQuoteEntryModel({
            organizationId,
            projectId,
            quoteNo: quoteNumber || null,
            mainQuote: {
                projectId,
                mainQuoteName,
                quoteCategory: quoteCategory.toLowerCase(), // Normalizing to lowercase
                works: []
            },
            grandTotal: 0
        });

        await newQuote.save();
        res.status(201).json({ ok: true, data: newQuote });

    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};




/**
 * UPDATING MAIN QUOTE METADATA
 * Specifically for mainQuoteName, quoteCategory, and projectId
 */
export const updateMainInternalQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { projectId, mainQuoteName, quoteCategory } = req.body;

        // 1. Validation check for mandatory fields
        if (!projectId || !mainQuoteName || !quoteCategory) {
            return res.status(400).json({
                ok: false,
                message: "Project ID, Quote Name, and Category are mandatory for update."
            });
        }

        // 2. Find and Update specifically the mainQuote sub-fields
        const updatedQuote = await InternalQuoteEntryModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    projectId: projectId, // Updating top-level projectId
                    "mainQuote.projectId": projectId, // Updating sub-schema projectId
                    "mainQuote.mainQuoteName": mainQuoteName,
                    "mainQuote.quoteCategory": quoteCategory.toLowerCase()
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedQuote) {
            return res.status(404).json({ ok: false, message: "Quote record not found." });
        }

        res.status(200).json({
            ok: true,
            message: "Main quote updated successfully",
            data: updatedQuote
        });

    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const getSingleInternalQuote = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // 1. Validation check for mandatory fields
        if (!id) {
            return res.status(400).json({
                ok: false,
                message: "id is required."
            });
        }

        // 2. Find and Update specifically the mainQuote sub-fields
        const quote = await InternalQuoteEntryModel.findByIdAndUpdate(
            id
        );

        if (!quote) {
            return res.status(404).json({ ok: false, message: "Quote record not found." });
        }

        res.status(200).json({
            ok: true,
            message: "Main quote updated successfully",
            data: quote
        });

    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const addOrUpdateWorkItem = async (req: Request, res: Response):Promise<any> => {
    try {
        const { quoteId } = req.params;
        const { workName, workId } = req.body;

        if (workId) {
            // Update existing work name
            await InternalQuoteEntryModel.updateOne(
                { _id: quoteId, "mainQuote.works._id": workId },
                { $set: { "mainQuote.works.$.workName": workName } }
            );
        } else {
            // Push a brand new work item container
            await InternalQuoteEntryModel.findByIdAndUpdate(quoteId, {
                $push: { "mainQuote.works": { workName, workTemplates: [], workTotal: 0 } }
            });
        }
        res.status(200).json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * 2. ADD/UPDATE A TEMPLATE WITHIN A WORK ITEM
 * This handles saving "Glass Work" inside "Cafeteria"
 */
export const upsertTemplateData = async (req: Request, res: Response):Promise<any> => {
    try {
        const { quoteId, workId } = req.params;
        const { templateName, templateData, singleTotal, templateId } = req.body;

        const quote = await InternalQuoteEntryModel.findById(quoteId);

        if (!quote) {
            return res.status(404).json({ message: "Quote not found", ok: false })
        }

        const work = (quote as any).mainQuote.works.id(workId);

        if (templateId) {
            // Update existing template within the work
            const template = work.workTemplates.id(templateId);
            template.templateData = templateData;
            template.singleTotal = singleTotal;
        } else {
            // Add new template to this specific work
            work.workTemplates.push({ templateName, templateData, singleTotal });
        }

        // Recalculate totals
        work.workTotal = work.workTemplates.reduce((acc:any, curr:any) => acc + (curr.singleTotal || 0), 0);
        quote.grandTotal = quote.mainQuote.works.reduce((acc, curr) => acc + (curr.workTotal || 0), 0);

        await quote.save();
        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};



// controllers/internalQuoteController.ts

export const updateTemplateFields = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId, templateId } = req.params;
        const { templateData, singleTotal } = req.body;

        // Construct the update object dynamically for the specific fields
        const updateQuery: any = {
            $set: {
                "mainQuote.works.$[work].workTemplates.$[temp].singleTotal": singleTotal,
            }
        };

        // Map individual fields into the templateData object
        // This ensures { height: 10 } doesn't delete { width: 5 }
        Object.keys(templateData).forEach((key) => {
            updateQuery.$set[`mainQuote.works.$[work].workTemplates.$[temp].templateData.${key}`] = templateData[key];
        });

        const quote = await InternalQuoteEntryModel.findByIdAndUpdate(
            quoteId,
            updateQuery,
            {
                arrayFilters: [{ "work._id": workId }, { "temp._id": templateId }],
                new: true
            }
        );

        if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });

        // Recalculate Work Total and Grand Total
        const work = (quote.mainQuote as any).works.id(workId);
        work.workTotal = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);
        quote.grandTotal = (quote.mainQuote as any).works.reduce((acc: number, curr: any) => acc + (curr.workTotal || 0), 0);

        await quote.save();
        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};