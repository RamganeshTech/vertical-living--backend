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



export const updatePreSalesQuoteName = async (req: Request, res: Response): Promise<any> => {
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
        const existingQuote = await PreSalesQuoteModel.findByIdAndUpdate(quoteId, { $set: { mainQuoteName: mainQuoteName } }, { new: true });

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

    } catch (error: any) {
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
            purpose,
            bhk,
            finishTier,
            config,
            totalAmount,
            status,
            globalDimType
        } = req.body;




        // --- 1. DEEP CLONE AND INITIALIZE BRAND SETS ---
        const processedConfig = JSON.parse(JSON.stringify(config));
        const plywoodBrands = new Set<string>();
        const innerLamBrands = new Set<string>();
        const outerLamBrands = new Set<string>();
        const fittingBrands = new Set<string>();

        // --- 2. ITERATE TECHNICAL TREE TO EXTRACT DATA & BRANDS ---
        Object.entries(processedConfig).forEach(([roomId, roomInsts]: any) => {
            Object.entries(roomInsts).forEach(([rIdx, products]: any) => {
                Object.entries(products).forEach(([prodId, instances]: any) => {
                    Object.entries(instances).forEach(([pIdx, details]: any) => {

                        // Collect Brands for the Global Brandlist
                        if (details.plywoodName) plywoodBrands.add(details.plywoodName);
                        if (details.innerName) innerLamBrands.add(details.innerName);
                        if (details.outerName) outerLamBrands.add(details.outerName);

                        // Collect Fitting Brands from nested array
                        (details.fittingsAndAccessories || []).forEach((f: any) => {
                            if (f.brandName) fittingBrands.add(f.brandName);
                        });

                        // --- RECALCULATE PRICE & SCOPE (As per your current logic) ---
                        const unitArea = Number(details.h || 0) * Number(details.w || 0);
                        const totalMaterialRate = Number(details.plywoodCost || 0) +
                            Number(details.innerCost || 0) +
                            Number(details.outerCost || 0);
                        const calculatedPrice = unitArea * totalMaterialRate;

                        // Generate Scope Sentences...
                        let sentences = [];
                        sentences.push(details.plywoodName ? `Primary structural fabrication utilizes ${details.plywoodName}.` : "...");
                        // ... (Include your full sentence logic here)

                        // Update specific unit in processedConfig
                        processedConfig[roomId][rIdx][prodId][pIdx].scopeOfWork = sentences.join(" ");
                        processedConfig[roomId][rIdx][prodId][pIdx].totals = {
                            furnitureTotal: calculatedPrice,
                            core: calculatedPrice,
                            fittings: 0, glues: 0, nbms: 0
                        };
                        processedConfig[roomId][rIdx][prodId][pIdx].productTotal = calculatedPrice;
                    });
                });
            });
        });


        //         // --- 4. CONSTRUCT THE BRANDLIST STRING ---
        //         const brandlistString = `Plywood: ${Array.from(plywoodBrands).join(", ") || 'Standard'}
        // Inner Laminate: ${Array.from(innerLamBrands).join(", ") || 'Standard'}
        // Outer Laminate: ${Array.from(outerLamBrands).join(", ") || 'Standard'}
        // Fittings: ${Array.from(fittingBrands).join(", ") || 'N/A'}`


        const brandlistParts = [];


        if (plywoodBrands.size > 0) {
            brandlistParts.push(`Plywood: ${Array.from(plywoodBrands).join(", ")}`);
        }

        if (innerLamBrands.size > 0) {
            brandlistParts.push(`Inner Laminate: ${Array.from(innerLamBrands).join(", ")}`);
        }

        if (outerLamBrands.size > 0) {
            brandlistParts.push(`Outer Laminate: ${Array.from(outerLamBrands).join(", ")}`);
        }

        if (fittingBrands.size > 0) {
            brandlistParts.push(`Fittings: ${Array.from(fittingBrands).join(", ")}`);
        }

        // Join only the parts that exist with a newline
        const brandlistString = brandlistParts.join("\n");


        // --- FORMATTING THE PAYMENT MILESTONES ---
        const milestones = [
            { m: "Booking Advance", a: "INR 10,000 (fixed)", w: "Site visit, discussion, proposal" },
            { m: "Design Approval", a: "INR 15,000 (fixed)", w: "2D/3D design, site measurement, BOQ" },
            { m: "Procurement", a: "80% of total", w: "Material purchase, fabrication initiation" },
            { m: "Execution", a: "10% of total", w: "Installation, finishing, electrical/plumbing" },
            { m: "Handover", a: "10% of total", w: "Snag closure, cleaning, final handover" }
        ];

        // Create the Milestone Table string
        let termsString = "VERTICAL LIVING – PAYMENT TERMS\n";
        termsString += "------------------------------------------------------------\n";
        termsString += "MILESTONE | AMOUNT | WORK INCLUDED\n";

        milestones.forEach(item => {
            termsString += `◆ ${item.m}: ${item.a} (${item.w}) \n`;
        });

        // --- FORMATTING THE LEGAL CONDITIONS ---
        termsString += "\nPAYMENT TERMS AND CONDITIONS\n";
        termsString += "------------------------------------------------------------\n";

        const conditions = [
            { label: "Delayed Payments:", text: "Interest of 2% per month applies after 5 working days." },
            { label: "GST:", text: "Added as applicable by law." },
            { label: "Forfeiture Clause:", text: "If next milestone is not paid within 7 days, previous fixed payments (INR 25,000) are forfeited. Vertical Living reserves the right to suspend project." },
            { label: "Legal Validity:", text: "Acceptance via digital/physical signature or email is enforceable under the IT Act, 2000." }
        ];

        conditions.forEach(cond => {
            termsString += `• ${cond.label} ${cond.text} \n`;
        });



        //     const whatsIncluded = `• All modular furniture as per approved design.
        // • Quality raw materials and premium hardware.
        // • Professional factory finish and edge-banding.
        // • On-site installation and finishing by skilled teams.`


        const whatsIncluded = `
• Modular Furniture (As per Approved Design)  
  Supply and installation of modular furniture strictly as per the final approved designs, layouts, dimensions, and specifications.

• Materials & Hardware (As Specified in the Quote)  
  Quality raw materials including boards/plywood, laminates/finishes, and premium hardware as mentioned in this quotation by brand, model, thickness, and finish.  
  Any upgrades or changes can be accommodated with a revised quote after your approval.

• Factory Finish & Edge Banding (2mm Standard Finish)  
  Professional factory finish with 2mm edge banding as part of the standard manufacturing process for the selected materials and finishes.  
  Special finishes or different edge band thickness can be provided based on your preference with a revised quote.
`;

        //     const whatsNotIncluded = `• Civil, and plumbing works.
        // • Granite or Quartz countertop supply and fitting.
        // • External appliances and loose furniture items.`

        const whatsNotIncluded = `
• Electrical, Plumbing, Painting & Civil Works (Unless Specifically Quoted)  
  Electrical works, plumbing works, painting, wall cutting/chasing, patchwork, plastering, and any other civil modifications are not included unless they are specifically mentioned in this quotation.

• Appliances, Lights & Loose Accessories  
  Appliances, lights, fixtures, decorative fittings, and loose accessories are not included unless explicitly specified in the quotation.

• Debris Removal, Permissions & Third-Party Charges  
  Debris removal, waste disposal, building permissions, society or association charges, parking or loading fees, lift usage charges, and any third-party coordination or approvals are not included unless clearly mentioned in this quotation.
`;


        //     const whatIsFree = `• Standard design consultation.
        // • Basic maintenance kit and support.
        // • Multiple Quote Variations.`

        const whatIsFree = `Complimentary (Applicable for projects above ₹5,00,000):
    • Electrical labour for open-wall wiring only
    • Excludes wall cutting/chasing, plastering, patchwork, painting
    • Excludes all electrical materials and accessories
    • Subject to Complimentary Terms mentioned in Disclaimer`



        const disclaimer = `DISCLAIMER, PRELIMINARY ESTIMATE & CHANGE CONTROL
------------------------------------------------------------
1. PURPOSE OF PRELIMINARY QUOTES: Any rough estimate or sqft-based pricing is shared solely to help the Client assess budget feasibility. Final project cost may vary significantly once actual requirements and scope are defined.

2. INDICATIVE NATURE OF QUOTES: Rates shared without complete inputs (design, site measurements, material preferences) are only indicative and not binding. Final pricing is issued only after design finalization and material selection.

3. DESIGN FINALITY: All dimensions, finishes, and specifications are based on details approved at the time of quotation. Changes requested after approval will be treated as variations with additional costs.

4. SCOPE BOUNDARIES: Covers only explicitly mentioned items. Extra civil, electrical, or plumbing works requested during execution will be charged separately via revised quotation.

5. MATERIAL & PRICE FLUCTUATIONS: Materials are subject to market availability. Prices are subject to change due to supplier revisions, tax changes, or logistics costs.

6. TIMELINE DEPENDENCIES: Estimates depend on timely approvals and site readiness. External delays or design changes will result in automatic timeline extensions without penalty to the Company.

7. CLIENT APPROVALS: Approvals given via email, WhatsApp, or signature are final. Rework requested after approval is chargeable.

8. SITE CONDITIONS: Quotation is based on visible conditions. Hidden structural defects, dampness, or concealed plumbing/electrical issues discovered during execution are out of scope and charged separately.

9. NO COMMITMENT: No price or timeline is locked until a detailed final quotation is formally approved. Preliminary numbers do not constitute a commitment.

10. NO VERBAL COMMITMENTS: Only specifications recorded in writing within this document shall be binding.

11. FORCE MAJEURE: The Company is not liable for delays caused by strikes, lockdowns, transport disruptions, or natural calamities.

------------------------------------------------------------------------------------------------------------------------

Complimentary Electrical Labour (Applicable for Projects Above ₹5,00,000)

• Complimentary electrical labour is provided only for open-wall wiring within the approved interior work scope.

• This complimentary service covers labour charges only and does not include any electrical materials or accessories such as wires, conduits, switches, sockets, switchboards, MCBs, DBs, fittings, lights, fans, or fixtures.

• Wall cutting, wall chasing, wall breaking, plastering, patchwork, painting, finishing, or restoration work is strictly excluded and will be charged separately if required.

• Complimentary electrical labour applies only to new wiring in open walls and excludes rewiring of existing concealed wiring, fault finding, rectification, shifting of main lines, or modifications to existing electrical infrastructure unless expressly quoted.

• Any additional electrical points, layout changes, or work beyond the approved electrical layout shall be chargeable.

• Complimentary electrical labour is applicable only if the final approved and executed project value exceeds ₹5,00,000. If the project value is revised below this threshold due to scope reduction, cancellation, or client-driven changes, the Company reserves the right to withdraw this benefit.

• Approvals, permits, inspections, and coordination with building management or authorities are not included and remain the Client’s responsibility unless separately quoted.

• This complimentary service does not extend the project delivery timeline. Delays due to material availability, client approvals, or site readiness shall not be attributed to the Company.

• Complimentary electrical labour is provided at the Company’s discretion, may be modified or withdrawn in case of payment delays, scope changes, site constraints, or non-compliance with payment terms, and is not a contractual entitlement.

`



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


                    brandlist: brandlistString,
                    whatsIncluded,
                    whatsNotIncluded,
                    whatIsFree,
                    disclaimer,
                    TermsAndConditions: termsString,

                    purpose: purpose || null,
                    globalDimType: globalDimType || null
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


// USED TO UPDATE ONLY THE TYPE 4 QUOTE IN THE PRE SALES DEPT

export const updatePreSalesQuote4 = async (req: Request, res: Response): Promise<any> => {
    try {
        const { quoteId } = req.params;
        const {
            // General Quote Strings
            clientDataTextArea,
            projectDetailsTextArea,
            whatsIncluded,
            whatsNotIncluded,
            whatIsFree,
            TermsAndConditions,
            disclaimer,
            brandlist,
            // The updated technical tree from Step 5
            processedConfig
        } = req.body;

        const files = req.files as any[] | undefined;

        // 1. Prepare basic updates for the top-level fields
        let updateData: any = {
            clientDataTextArea,
            projectDetailsTextArea,
            whatsIncluded,
            whatsNotIncluded,
            whatIsFree,
            TermsAndConditions,
            disclaimer,
            brandlist,
            updatedAt: new Date()
        };

        // 2. Handle technical tree updates
        // If the frontend sends a full processedConfig, we update the whole tree
        if (processedConfig) {
            const parsedConfig = typeof processedConfig === 'string'
                ? JSON.parse(processedConfig)
                : processedConfig;

            // 3. Handle File Uploads for 3D Images
            // If files are uploaded, we need to inject the URLs into the parsedConfig 
            // before saving it to the database.
            if (files && files.length > 0) {
                files.forEach(file => {
                    // Expected fieldname format from frontend: "prodImage_RoomName_rIdx_ProdId_pIdx"
                    const parts = file.fieldname.split('_');
                    if (parts[0] === 'prodImage' && parts.length === 5) {
                        const [_, room, rIdx, prod, pIdx] = parts;

                        // Navigate the tree and inject the S3/Cloudinary URL
                        if (parsedConfig[room]?.[rIdx]?.[prod]?.[pIdx]) {
                            parsedConfig[room][rIdx][prod][pIdx].imageUrl = file.location;
                        }
                    }
                });
            }

            updateData.config = parsedConfig;
        }

        // 4. Perform the update
        const updatedQuote = await PreSalesQuoteModel.findByIdAndUpdate(
            quoteId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedQuote) {
            return res.status(404).json({ ok: false, message: "Pre-Sales Quote not found" });
        }

        res.status(200).json({
            ok: true,
            message: "Step 5 changes saved successfully",
            data: updatedQuote
        });

    } catch (error: any) {
        console.error("Step 5 Update Error:", error);
        res.status(500).json({
            ok: false,
            message: "Failed to update pre-sales quote details",
            error: error.message,
        });
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

    } catch (error: any) {
        console.error("Clone PreSales Quote Error:", error);
        return res.status(500).json({
            ok: false,
            message: error?.message
        });
    }
};
