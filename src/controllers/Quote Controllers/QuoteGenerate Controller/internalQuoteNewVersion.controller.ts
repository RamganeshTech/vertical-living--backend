import { Request, Response } from 'express';
// import InternalQuoteEntryModel from '../models/MaterialQuote'; // Adjust path
import mongoose from 'mongoose';
import InternalQuoteEntryModel, { ISubLettingData } from '../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model';
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
            quoteCategory,
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


export const addOrUpdateWorkItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;
        const { workName, workId } = req.body;

        let work = null
        if (workId) {
            // Update existing work name
            work = await InternalQuoteEntryModel.updateOne(
                { _id: quoteId, "mainQuote.works._id": workId },
                { $set: { "mainQuote.works.$.workName": workName } }
            );
        } else {
            // Push a brand new work item container
            work = await InternalQuoteEntryModel.findByIdAndUpdate(quoteId, {
                $push: { "mainQuote.works": { workName, workTemplates: [], workTotal: 0 } }
            });
        }
        res.status(200).json({ ok: true, data: work });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * 2. ADD/UPDATE A TEMPLATE WITHIN A WORK ITEM
 * This handles saving "Glass Work" inside "Cafeteria"
 */
// export const upsertTemplateData = async (req: Request, res: Response):Promise<any> => {
//     try {
//         const { quoteId, workId } = req.params;
//         const { templateName, templateData, singleTotal, templateId } = req.body;

//         const quote = await InternalQuoteEntryModel.findById(quoteId);

//         if (!quote) {
//             return res.status(404).json({ message: "Quote not found", ok: false })
//         }

//         const work = (quote as any).mainQuote.works.id(workId);

//         if (templateId) {
//             // Update existing template within the work
//             const template = work.workTemplates.id(templateId);
//             template.templateData = templateData;
//             template.singleTotal = singleTotal;
//         } else {
//             // Add new template to this specific work
//             work.workTemplates.push({ templateName, templateData, singleTotal });
//         }

//         // Recalculate totals
//         work.workTotal = work.workTemplates.reduce((acc:any, curr:any) => acc + (curr.singleTotal || 0), 0);
//         quote.grandTotal = quote.mainQuote.works.reduce((acc, curr) => acc + (curr.workTotal || 0), 0);

//         await quote.save();
//         res.status(200).json({ ok: true, data: quote });
//     } catch (error: any) {
//         res.status(500).json({ ok: false, message: error.message });
//     }
// };



// controllers/internalQuoteController.ts

export const upsertTemplateData = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId } = req.params;
        const {
            workType,        // 'sublet' or 'template'
            templateName,    // e.g., 'Glass', 'Plywood' (only for templates)
            // templateData,    // JSON data for templates
            // subLettingData,  // Data matching ISubLettingData schema
            // singleTotal,     // The calculated total for this specific entry
            // specId           // The ID if we are updating an existing spec
        } = req.body;

        const quote = await InternalQuoteEntryModel.findById(quoteId);
        if (!quote) return res.status(404).json({ message: "Quote not found", ok: false });

        const work = (quote as any).mainQuote.works.id(workId);
        if (!work) return res.status(404).json({ message: "Work Area not found", ok: false });

        // Update the workType of the WorkItem container
        work.workType = workType;

        if (workType === 'sublet') {
            // --- HANDLE SUBLETTING DATA ---
            // if (specId) {
            //     const sublet = work.subLettingData.id(specId);
            //     if (sublet) {
            //         sublet.sections = subLettingData.sections;
            //         sublet.allSectionTotalArea = subLettingData.allSectionTotalArea;
            //         sublet.vendorDetails = subLettingData.vendorDetails;
            //         sublet.singleTotal = singleTotal; // Maps to vendor final quote
            //     }
            // } else {
            // Initialize empty sublet data if not provided
            
            const initialSublet = {
                sections: [{ sectionName: "Section 1", height: 0, width: 0, totalArea: 0 }],
                allSectionTotalArea: 0,
                vendorDetails: { vendorName: "", worktimeline: 0, sqftRate: 0, finalQuoteRate: 0 }
            };
            work.subLettingData.push({ ...initialSublet, singleTotal: 0 });
            // }
        } else {
            // --- HANDLE MATERIAL TEMPLATE DATA ---
            // if (specId) {
            //     const template = work.workTemplates.id(specId);
            //     if (template) {
            //         template.templateData = templateData;
            //         template.singleTotal = singleTotal;
            //     }
            // } else {
            work.workTemplates.push({ templateName, templateData: {}, singleTotal: 0 });
            // }
        }

        // --- RECALCULATE TOTALS ---
        // Sum of sublets + Sum of material templates
        const subletTotal = work.subLettingData.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);
        const materialTotal = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);

        work.workTotal = subletTotal + materialTotal;

        // Update the Master Grand Total of the entire quote
        quote.grandTotal = quote.mainQuote.works.reduce((acc: number, curr: any) => acc + (curr.workTotal || 0), 0);

        await quote.save();
        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};



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
        // work.workTotal = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);
        const materialSum = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);

        // 2. Sum Subletting Data (Ensuring we include these in the work total)
        const subletSum = work.subLettingData.reduce((acc: number, curr: any) => 
            acc + (curr.vendorDetails?.finalQuoteRate || 0), 0
        );

        // 3. Update Work Total
        work.workTotal = materialSum + subletSum;

        // 4. Update Grand Total (Sum of all workTotals across all areas)
        quote.grandTotal = (quote.mainQuote as any).works.reduce((acc: number, curr: any) => 
            acc + (curr.workTotal || 0), 0
        );

        await quote.save();
        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateSubletFields = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId, subletId } = req.params;
        const { subLettingData } = req.body; // This contains the whole ISubLettingData object

        // Construct the update object for the Subletting schema fields
        const updateQuery: any = {
            $set: {
                // Update top-level sublet fields
                "mainQuote.works.$[work].subLettingData.$[sublet].sections": subLettingData.sections,
                "mainQuote.works.$[work].subLettingData.$[sublet].allSectionTotalArea": subLettingData.allSectionTotalArea,
                "mainQuote.works.$[work].subLettingData.$[sublet].vendorDetails": subLettingData.vendorDetails,
                // We use finalQuoteRate as the singleTotal for this specific sublet entry
                // "mainQuote.works.$[work].subLettingData.$[sublet].singleTotal": subLettingData.vendorDetails.finalQuoteRate
            }
        };

        const quote = await InternalQuoteEntryModel.findByIdAndUpdate(
            quoteId,
            updateQuery,
            {
                arrayFilters: [
                    { "work._id": workId }, 
                    { "sublet._id": subletId }
                ],
                new: true
            }
        );

        if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });

        // RECALCULATE TOTALS
        const work = (quote.mainQuote as any).works.id(workId);
        
        // Work Total = Material Templates Sum + Subletting Sum
        const materialSum = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);
        const subletSum = work.subLettingData.reduce((acc: number, curr: ISubLettingData) => acc + (curr.vendorDetails.finalQuoteRate || 0), 0);
        
        work.workTotal = materialSum + subletSum;

        // Grand Total = Sum of all Work Totals
        quote.grandTotal = quote.mainQuote.works.reduce((acc: number, curr: any) => acc + (curr.workTotal || 0), 0);

        await quote.save();
        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};



// controllers/internalQuoteController.ts

export const deleteTemplateFromWork = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId, templateId, type } = req.params;

        const quote = await InternalQuoteEntryModel.findById(quoteId);
        if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });



        // 1. Locate the specific work area
        const work = (quote.mainQuote as any).works.id(workId);
        if (!work) return res.status(404).json({ ok: false, message: "Work area not found" });

        if (type !== "template" && type !== "sublet") {
            return res.status(404).json({ ok: false, message: "type should be template or sublet" });
        }

        // 2. Pull (Delete) the specific template from the nested array
        if (type === "sublet") {
            work.subLettingData.pull({ _id: templateId });
            work.workTotal = work.subLettingData.reduce((acc: number, curr: ISubLettingData) => acc + (curr.vendorDetails.finalQuoteRate || 0), 0);

        }
        else if (type === "template") {
            work.workTemplates.pull({ _id: templateId });
            work.workTotal = work.workTemplates.reduce((acc: number, curr: any) => acc + (curr.singleTotal || 0), 0);
        }

        // 3. Recalculate Hierarchy Totals
        // Area Total = sum of remaining templates

        // Master Grand Total = sum of all area totals
        quote.grandTotal = quote.mainQuote.works.reduce((acc: number, curr: any) => acc + (curr.workTotal || 0), 0);

        await quote.save();

        res.status(200).json({ ok: true, data: quote, message: "Template removed successfully" });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * RENAME WORK AREA
 * Route: PATCH /v1/renameworkitem/:quoteId/:workId
 */
export const renameWorkItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId } = req.params;
        const { workName } = req.body;

        if (!workName) return res.status(400).json({ ok: false, message: "Work name is required" });

        const quote = await InternalQuoteEntryModel.findOneAndUpdate(
            { _id: quoteId, "mainQuote.works._id": workId },
            {
                $set: { "mainQuote.works.$.workName": workName?.trim() }
            },
            { new: true }
        );

        if (!quote) return res.status(404).json({ ok: false, message: "Quote or Work Area not found" });

        res.status(200).json({ ok: true, data: quote });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * DELETE WORK AREA COMPLETELY
 * Route: DELETE /v1/deleteworkitem/:quoteId/:workId
 */
export const deleteWorkItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, workId } = req.params;

        // 1. Pull the work item from the array
        const quote = await InternalQuoteEntryModel.findByIdAndUpdate(
            quoteId,
            {
                $pull: { "mainQuote.works": { _id: workId } }
            },
            { new: true }
        );

        if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });

        // 2. Recalculate Grand Total after deletion
        quote.grandTotal = quote.mainQuote.works.reduce((acc: number, curr: any) => acc + (curr.workTotal || 0), 0);

        await quote.save();

        res.status(200).json({ ok: true, data: quote, message: "Work area deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};