import { Request, Response } from "express";
import { Types } from "mongoose"
import InternalQuoteEntryModel, { IFurniture } from "../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
// import { generatePdfMaterialPacakgeComparison } from "../../stage controllers/material Room confirmation/materialRoomConfirmation.controller";
import { generateQuoteVariantPdf } from "./pdfQuoteVarientGenerate";



import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config()

// Initialize Gemini (Ensure your API Key is in .env)
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export const getMaterialQuoteSingle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, id } = req.params;

    // Optional: Validate inputs
    if (!organizationId || !id) {
      return res.status(400).json({ ok: false, message: "Invalid Ids" });
    }

    const quote = await InternalQuoteEntryModel.findOne({
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



export const getMaterialItemsByCategoryForQuote = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, categoryName } = req.params;

    // Optional: Validate inputs
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Invalid organizationId" });
    }

    if (!categoryName) {
      return res.status(400).json({ ok: false, message: "Category (e.g., plywood) is required" });
    }
    //     console.log("im gettni called")
    console.log("categoryName", categoryName)
    const items = await ItemModel.find({
      organizationId,
      $expr: {
        $eq: [
          { $toLower: "$categoryName" },
          categoryName.toLowerCase().trim()
        ]
      }
    });
    // console.log("item", items)

    return res.status(200).json({
      ok: true,
      message: "Brands items fetched",
      data: items,
    });

  } catch (error: any) {
    console.error("Error fetching material items:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch material items",
      error: error.message,
    });
  }
};




export const generateNextQuoteNumber = async (organizationId: string): Promise<string> => {
  const variants = await QuoteVarientGenerateModel.find({ organizationId }).select("quoteNo");

  const allQuoteNos = variants.map((doc) => {
    const num = Number(String(doc.quoteNo)?.replace("Quote-", ""));
    return isNaN(num) ? 0 : num;
  });

  const maxQuoteNo = allQuoteNos.length ? Math.max(...allQuoteNos) : 0;

  const nextQuoteNo = maxQuoteNo + 1;

  return `Quote-${nextQuoteNo}`;
};



export const createVariantQuotePdfGenerator = async (req: Request, res: Response): Promise<any> => {
  try {
    const { quoteId } = req.params
    const {
      plywoodBrandId,  // 🆕 ID from frontend
      innerLaminateId, // 🆕 ID from frontend
      outerLaminateId, // 🆕 ID from frontend
      brandName,
      innerLaminateBrand,
      outerLaminateBrand,
      organizationId,
      projectId,
      furnitures,
      mainQuoteName,
      quoteType,
      grandTotal,
      commonMaterials,
      commonProfitOverride,
      globalTransportation,
      globalProfitPercent,
      notes = null,
      templateType = "type 1"
    } = req.body;


    // console.log("furnitures",furnitures)
    // console.log("core mateiral 1",furnitures[0].coreMaterials[0])
    // console.log("core mateiral 1",furnitures[0].coreMaterials[1])

    // ✅ Basic validation
    if (!quoteId) {
      return res.status(400).json({ ok: false, message: "Invalid or missing quoteId" });
    }

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Invalid or missing organizationId" });
    }

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Invalid or missing projectId" });
    }

    if (!furnitures || !Array.isArray(furnitures) || furnitures.length === 0) {
      return res.status(400).json({ ok: false, message: "Furnitures must be a non-empty array" });
    }





    // 1. Fetch the existing Internal Quote to preserve its numeric data
    const existingQuote = await InternalQuoteEntryModel.findById(quoteId);

    if (existingQuote) {
      // ✅ Update Global IDs
      existingQuote.plywoodBrandId = plywoodBrandId || null;
      existingQuote.innerLaminateId = innerLaminateId || null;
      existingQuote.outerLaminateId = outerLaminateId || null;

      // ✅ Update IDs inside each Furniture without touching other fields
      // We map through existing furniture and find the match from the incoming request
      if (existingQuote.furnitures && furnitures) {
        existingQuote.furnitures = existingQuote.furnitures.map((existingFurn: IFurniture, index: number) => {
          const incomingFurn = furnitures[index];

          if (incomingFurn) {
            // ONLY update the Brand IDs
            existingFurn.plywoodBrandId = incomingFurn.plywoodBrandId || null;
            existingFurn.innerLaminateBrandId = incomingFurn.innerLaminateBrandId || null;
            existingFurn.outerLaminateBrandId = incomingFurn.outerLaminateBrandId || null;
          }
          return existingFurn;
        });
      }

      // Save the original quote with ONLY the brand changes
      await existingQuote.save();

      // console.log("exiting internalquote",existingQuote)
    }



    const quoteNo = await generateNextQuoteNumber(organizationId);


    // 1. Fetch data from Project and Requirement models
    const [projectData, requirementDoc] = await Promise.all([
      ProjectModel.findById(projectId).populate("organizationId"),
      RequirementFormModel.findOne({ projectId }),
    ]);

    const clientRaw: any = requirementDoc?.clientData || {};



    console.log("clientRaw", clientRaw)
    // 2. Format Client Details String
    const clientDetailsString = `Name: ${clientRaw?.clientName || 'Not Entered Yet'}
Email: ${clientRaw.email || 'Not Entered Yet'}
WhatsApp: ${clientRaw.whatsapp || 'Not Entered Yet'}
Location: ${clientRaw.location || 'Not Entered Yet'}`;

    // 3. Format Project Details String
    const projectDetailsString = `Project Name: ${projectData?.projectName || '-'}
Quotation No: ${quoteNo}
Date of Issue: ${new Date().toLocaleDateString('en-IN')}`;

    // 4. Extract Unique Brands for Brandlist String
    const allFittings = furnitures.flatMap(f => f.fittingsAndAccessories || []);
    const allCommon = commonMaterials || [];

    const uniqueFittings = [...new Set(allFittings.map(item => item.brandName).filter(Boolean))];
    const uniqueCommon = [...new Set(allCommon.map((item: any) => item.brandName).filter(Boolean))];

    // Get plywood/laminate brands from furniture blocks
    const uniquePlywood = [...new Set(furnitures.map(f => f.plywoodBrand).filter(Boolean))];
    const uniqueInnerLam = [...new Set(furnitures.map(f => f.innerLaminateBrand).filter(Boolean))];
    const uniqueOuterLam = [...new Set(furnitures.map(f => f.outerLaminateBrand).filter(Boolean))];

    const brandlistString = `Plywood: ${uniquePlywood.join(", ") || 'Standard'}
Inner Laminate: ${uniqueInnerLam.join(", ") || 'Standard'}
Outer Laminate: ${uniqueOuterLam.join(", ") || 'Standard'}
Fittings: ${uniqueFittings.join(", ") || 'N/A'}
Common Materials: ${uniqueCommon.join(", ") || 'N/A'}`;



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
      termsString += `◆ ${item.m}: ${item.a} (${item.w})\n`;
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
      termsString += `• ${cond.label} ${cond.text}\n`;
    });



    const whatsIncluded = `• All modular furniture as per approved design.
• Quality raw materials and premium hardware.
• Professional factory finish and edge-banding.
• On-site installation and finishing by skilled teams.`

    const whatsNotIncluded = `• Civil, and plumbing works.
• Granite or Quartz countertop supply and fitting.
• External appliances and loose furniture items.`

    //     const whatIsFree = `• Standard design consultation.
    // • Basic maintenance kit and support.
    // • Multiple Quote Variations.`

    // const whatIsFree = `• Electrical Work is complementary`
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

11. FORCE MAJEURE: The Company is not liable for delays caused by strikes, lockdowns, transport disruptions, or natural calamities.`





    // --- GEMINI SCOPE OF WORK GENERATION ---
    // const model = genAI.models.generateContent({ model: "gemini-1.5-flash" });

    // --- GEMINI SCOPE OF WORK GENERATION ---
    const furnituresWithAIQuotes = await Promise.all(
      furnitures.map(async (furniture: any) => {
        try {
          const promptText = `
        Act as a professional interior designer for "Vertical Living". 
        Write a professional "Scope of Work" (max 2 sentences) for this furniture: ${furniture.furnitureName}.
        Details:
        - Material: ${furniture.plywoodBrand || 'Premium'} Plywood.
        - Finish: ${furniture.outerLaminateBrand || 'Selected'} Outer Laminate and ${furniture.innerLaminateBrand || 'Matching'} Inner Laminate.
        - Hardware: ${furniture.fittingsAndAccessories?.map((f: any) => f.itemName).join(", ") || 'Standard branded fittings'}.
        
        Write it in a formal tone focusing on manufacturing quality and installation.
      `;

          // In @google/genai, you call generateContent directly from models
          // The 'contents' property requires a specific structure: [{ role: 'user', parts: [{ text: '...' }] }]
          const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: promptText }] }] // ✅ Fixed 'contents' requirement
          });

          // Extract text from the candidate parts
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

          return {
            ...furniture,
            scopeOfWork: text || `Professional fabrication and installation of ${furniture.furnitureName}.`
          };
        } catch (aiError) {
          console.error("AI Generation failed for a furniture item:", aiError);
          return {
            ...furniture,
            scopeOfWork: `Comprehensive manufacturing and installation of ${furniture.furnitureName} as per approved site measurements.`
          };
        }
      })
    );


    // 🟢 Create DB entry (pdfLink: null for now, will update after PDF gen)
    const newVariant = await QuoteVarientGenerateModel.create({
      quoteNo,
      quoteId,
      brandName,
      innerLaminateBrand,
      outerLaminateBrand,
      mainQuoteName: mainQuoteName,
      quoteType: quoteType,

      organizationId,
      projectId,
      furnitures: furnituresWithAIQuotes,
      commonMaterials,


      // ✅ Store pre-formatted strings for Type 4 textareas
      clientDetails: clientDetailsString,
      projectDetails: projectDetailsString,
      brandlist: brandlistString,

      // Set default values for other textarea fields if empty
      // whatsIncluded: "Standard interior execution as per design...",
      // whatsNotIncluded: "Civil work, electrical points, and appliances...",
      // whatIsFree: "Complementary deep cleaning post-installation",
      // disclaimer: "Final measurements subject to site conditions.",


      whatsIncluded,
      whatsNotIncluded,
      whatIsFree,
      disclaimer,
      TermsAndConditions: termsString,
      commonProfitOverride,
      globalTransportation,
      globalProfitPercent,

      grandTotal,
      notes,
      pdfLink: null,
      pdfType: []
    });
    // console.log("new varient", newVariant)
    // const pdfResponse = await generateQuoteVariantPdf({ quoteId, projectId, newVariant });
    const pdfResponse = {
      fileName: null,
      fileUrl: null,
      // updatedDoc: newVariant
    }



    newVariant.pdfLink
    await newVariant.save()

    return res.status(201).json({
      ok: true,
      message: "Variant quote created successfully",
      data: {
        quote: newVariant,
        // fileName: pdfResponse.fileName,
        // url: pdfResponse.fileUrl, // ✅ PDF S3 URL
        // data: pdfResponse.updatedDoc, // ✅ Updated DB doc with PDF link
        ...pdfResponse
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



// controllers/quoteVariantController.js

export const updateQuoteVaraintforClient = async (req: Request, res: Response): Promise<any> => {
  try {
    const { quoteId } = req.params;
    const {
      clientDetails,
      projectDetails,
      whatsIncluded,
      whatsNotIncluded,
      whatIsFree,
      TermsAndConditions,
      disclaimer,
      brandlist,
      furnitureUpdates

    } = req.body;



    const files = req.files as any[] | undefined;
    const parsedUpdates = furnitureUpdates ? JSON.parse(furnitureUpdates) : [];

    // 1. Prepare the basic updates
    let updateObject: any = {
      $set: {
        clientDetails,
        projectDetails,
        whatsIncluded,
        whatsNotIncluded,
        whatIsFree,
        TermsAndConditions,
        disclaimer,
        brandlist,
      }
    };


    // 2. Fetch the current quote to ensure we have the structure
    const quote = await QuoteVarientGenerateModel.findById(quoteId);
    if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });

    // 3. Process Furniture Updates (Image URLs and Dimensions)
    // parsedUpdates.forEach((update: any) => {
    //   const { furnitureId, dimention } = update;

    //   // Find if a file was uploaded for this specific furniture
    //   const fieldKey = `furnitureImage_${furnitureId}`;
    //   const matchedFile = files?.find(f => f.fieldname === fieldKey);

    //   // Update dimensions
    //   updateObject.$set[`furnitures.$[elem].dimention`] = dimention;

    //   // Update Image URL ONLY if a new file was uploaded
    //   if (matchedFile) {
    //     // We update the imageUrl inside the coreMaterials[0] specifically
    //     updateObject.$set[`furnitures.$[elem].coreMaterials.0.imageUrl`] = matchedFile.location;
    //   }
    // });

    // const updatedQuote = await QuoteVarientGenerateModel.findByIdAndUpdate(
    //   quoteId,
    //   updateObject,
    //   {
    //     arrayFilters: [{ "elem._id": { $in: parsedUpdates.map((u: any) => u.furnitureId) } }],
    //     new: true
    //   }
    // );



    // 1. Prepare bulk operations
    const bulkOps = [];

    // 2. Add the general text field updates (clientDetails, etc.)
    // 1. General Fields Update (Only if values exist)
    bulkOps.push({
      updateOne: {
        filter: { _id: new Types.ObjectId(quoteId) },
        update: {
          $set: {
            clientDetails,
            projectDetails,
            whatsIncluded,
            whatsNotIncluded,
            whatIsFree,
            TermsAndConditions,
            disclaimer,
            brandlist,
            updatedAt: new Date()
          }
        }
      }
    });

    // 3. Add individual furniture updates to the bulk array
    // 2. Individual Furniture Updates
    // 2. Individual Furniture Updates
    parsedUpdates.forEach((update: any) => {
      const fieldKey = `furnitureImage_${update.furnitureId}`;
      const matchedFile = files?.find(f => f.fieldname === fieldKey);

      const setPayload: any = {
        "furnitures.$[elem].dimention": update.dimention,
        "furnitures.$[elem].scopeOfWork": update.scopeOfWork
      };

      if (matchedFile) {
        setPayload["furnitures.$[elem].coreMaterials.0.imageUrl"] = matchedFile.location;
      }

      bulkOps.push({
        updateOne: {
          // ✅ Convert both IDs to ObjectIds
          filter: { _id: new Types.ObjectId(quoteId) },
          update: { $set: setPayload },
          arrayFilters: [{ "elem._id": new Types.ObjectId(update.furnitureId) }]
        }
      });
    });

    // Execute bulkWrite with timestamps disabled for the individual array ops if needed,
    // or just run it standard as below:
    const result = await QuoteVarientGenerateModel.collection.bulkWrite(bulkOps, { ordered: true });


    // const updatedQuote = await QuoteVarientGenerateModel.findByIdAndUpdate(
    //   quoteId,
    //   {
    //     $set: {
    //       clientDetails,
    //       projectDetails,
    //       whatsIncluded,
    //       whatsNotIncluded,
    //       whatIsFree,
    //       TermsAndConditions,
    //       disclaimer,
    //       brandlist
    //     }
    //   },
    //   { new: true } // Return the updated document
    // );

    if (!result) {
      return res.status(404).json({ ok: false, message: "Quote not found" });
    }

    res.status(200).json({
      ok: true,
      message: "Template details saved successfully",
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: "Failed to create variant quote",
      error: error.message,
    });
  }
};


export const deleteClientQuote = async (req: Request, res: Response): Promise<any> => {
  try {
    const { quoteId } = req.params



    // ✅ Basic validation
    if (!quoteId) {
      return res.status(400).json({ ok: false, message: "Invalid or missing quoteId" });
    }

    // 🟢 Create DB entry (pdfLink: null for now, will update after PDF gen)
    const newVariant = await QuoteVarientGenerateModel.findByIdAndDelete(quoteId);

    return res.status(201).json({
      ok: true,
      message: "Clinet Quote deleted successfully",
      data: newVariant,
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


export const getVariantQuoteDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        message: "Quote variant ID is required.",
      });
    }

    const quote = await QuoteVarientGenerateModel.find({ projectId })


    return res.status(200).json({
      ok: true,
      message: "Quote variant fetched successfully.",
      data: quote,
    });
  } catch (error: any) {
    console.error("Error fetching quote variant:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch variant quote.",
      error: error.message,
    });
  }
};



