import { Request, Response } from "express";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import { generateClientQuoteVariantPdfwithTemplates, generateClientQuoteVariantSqftRatePdfwithTemplates } from "../Quote Varaint Controller/pdfQuoteVarientGenerate";


export const getAllClientQuotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const {
            projectId,
            createdAt, quoteNo,

            search,      // Global search term
            startDate,   // Filter start
            endDate,     // Filter end
            quoteType    // basic, sqft_rate, etc.

        } = req.query;
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


        if (search) {
            const searchRegex = new RegExp(String(search).trim(), 'i');
            filters.$or = [
                { quoteNo: { $regex: searchRegex } },
                { mainQuoteName: { $regex: searchRegex } }
            ];
        }

        // ✅ Quote Type Filter
        if (quoteType && quoteType !== 'all') {
            filters.quoteType = quoteType;
        }

        // ✅ Date Range Filter (startDate to endDate)
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) {
                const start = new Date(startDate as string);
                start.setHours(0, 0, 0, 0);
                filters.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999); // Include the full end day
                filters.createdAt.$lte = end;
            }
        }


        const quotes = await QuoteVarientGenerateModel.find(filters).sort({ createdAt: -1 })
            .populate("projectId", "_id projectName")
            .populate("quoteId", "_id quoteNo mainQuoteName quoteType quoteCategory")

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



export const getAllClientQuotesFromDropDown = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.params;
        // Optional: Validate inputs
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Invalid organizationId" });
        }

        const quotes = await QuoteVarientGenerateModel.find({ organizationId, projectId }).sort({ createdAt: -1 }).populate("projectId", "_id projectName");

        return res.status(200).json({
            ok: true,
            message: "quotes fetched successfully for drop down",
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




//  generate differnt types of pdf based on the ytp w give as input



export const generateClientPdfWithTypes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId, projectId } = req.params
        const { isBlurred = false, quoteType = "basic", type } = req.body //type 1, 2, 3


        const newVariant = await QuoteVarientGenerateModel.findById(quoteId).populate('projectId')

        if (!newVariant) {
            return res.status(404).json({ messaage: "quote not found", ok: false })
        }



        let pdfResponse = null

        // console.log("new varient", newVariant)
        if (quoteType === "basic") {
            pdfResponse = await generateClientQuoteVariantPdfwithTemplates({ quoteId, projectId, newVariant, templateType: type, isBlurred });
        }
        // const pdfResponse = await generateQuoteVariantPdfWithTemplate({ quoteId, projectId, newVariant , templateType});

        // newVariant.pdfLink
        // await newVariant.save()

        if (quoteType === "sqft_rate") {
            pdfResponse = await generateClientQuoteVariantSqftRatePdfwithTemplates({ quoteId, projectId, newVariant, templateType: "type 1", isBlurred })
        }


        return res.status(201).json({
            ok: true,
            message: "Variant quote created and PDF generated successfully",
            data: {
                fileName: pdfResponse?.fileName || null,
                url: pdfResponse?.fileUrl, // ✅ PDF S3 URL
                data: pdfResponse?.updatedDoc, // ✅ Updated DB doc with PDF link
            },
        });

    } catch (error: any) {
        console.error("Error creating variant quote:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to create variant quote",
            error: error.message,
        });
    }
};




// export const migratePdfTypeField = async () => {
//     try {
//         console.log("Starting migration: Setting pdfType to [] where null or missing...");

//         const result = await QuoteVarientGenerateModel.updateMany(
//             {
//                 $or: [
//                     { pdfType: { $exists: false } }, // Field doesn't exist
//                     { pdfType: null }                // Field is explicitly null
//                 ]
//             },
//             {
//                 $set: { pdfType: [] }                // Initialize as empty array
//             }
//         );

//         console.log(`Migration successful!`);
//         console.log(`Matched documents: ${result.matchedCount}`);
//         console.log(`Modified documents: ${result.modifiedCount}`);

//     } catch (error) {
//         console.error("Migration failed:", error);
//     }
// };

// // Call the function once
// // migratePdfTypeField();

