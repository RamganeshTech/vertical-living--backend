import { Request, Response } from "express";
import { Types } from "mongoose"
import InternalQuoteEntryModel, { IFurniture } from "../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
// import { generatePdfMaterialPacakgeComparison } from "../../stage controllers/material Room confirmation/materialRoomConfirmation.controller";
import { generateQuoteVariantPdf } from "./pdfQuoteVarientGenerate";



import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { OrderMaterialHistoryModel } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
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


    // console.log("projectId from the quote varaint", projectId)


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

    // const projectId = existingQuote?.projectId

    // 1. Fetch data from Project and Requirement models
    const [projectData, requirementDoc] = await Promise.all([
      ProjectModel.findById(projectId).populate("organizationId"),
      RequirementFormModel.findOne({ projectId }),
    ]);

    // console.log("projectData", projectData)
    // console.log("requirementDoc", requirementDoc)

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






    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));



    //  OLD VERSION
    // --- GEMINI SCOPE OF WORK GENERATION ---
    // const furnituresWithAIQuotes = await Promise.all(
    //   furnitures.map(async (furniture: any, index:number) => {

    //     await delay(500 * index);

    //     try {
    //       // 1. Build a clean dataset of ONLY what exists
    //       const technicalData = [];

    //       if (furniture?.plywoodBrand) technicalData.push(`Plywood: ${furniture.plywoodBrand}`);
    //       if (furniture?.outerLaminateBrand) technicalData.push(`Outer Mica: ${furniture.outerLaminateBrand}`);
    //       if (furniture?.innerLaminateBrand) technicalData.push(`Inner Mica: ${furniture.innerLaminateBrand}`);

    //       const hardware = furniture?.fittingsAndAccessories
    //         ?.map((f: any) => f.itemName)
    //         .filter((name: string) => name && name.trim() !== "")
    //         .join(", ");
    //       if (hardware) technicalData.push(`Hardware Integration: ${hardware}`);

    //       const dim = furniture?.dimention || {};
    //       if (dim?.width && dim?.height && dim?.depth) {
    //         technicalData.push(`Form Factor: ${dim.width}mm x ${dim.height}mm x ${dim.depth}mm`);
    //       }

    //       // 2. Construct the Engineering Prompt
    //       const promptText = `
    //     Act as a Lead Production Engineer and  
    //     Write a highly technical, engineering-grade "Execution Scope" for a furniture unit.

    //     Input Specifications:
    //     ${technicalData.join("\n")}

    //     Constraints:
    //     1. Write exactly 4-5 detailed sentences. Do not provide a short summary.
    //     2. Describe the fabrication process: CNC precision cutting, edge-banding sealing, and structural reinforcement.
    //     3. Mention the specific brands provided above ONLY. Never make up a brand.
    //     4. Focus on "Mechanical Tolerances," "Structural Load-Bearing Integrity," and "Precision Assembly."
    //     5. NO FILLER: Do not use words like "N/A", "Unknown", "Nila", or default brands. 
    //     6 NO LABELS: If a value was not provided above, do not mention that category at all.
    //     7. NO COMMERCIALS: Strictly prohibited to mention cost, price, INR, profit, or currency.
    //     8. NO ITEM NAMES: Do not repeat the name of the furniture item in the description.
    //     9. STYLE: Focus on "structural stability," "precision joinery," "mechanical tolerances," and "material performance."
    //   `;

    //       const result = await genAI.models.generateContent({
    //         model: "gemini-2.0-flash-lite",
    //         contents: [{ role: 'user', parts: [{ text: promptText }] }],
    //         config: {
    //           temperature: 0.5,
    //           maxOutputTokens: 300
    //         },
    //       });

    //       const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    //       // 3. Final Cleanup: Remove any accidental "N/A" or "item" mentions
    //       const engineeringText = text
    //         .replace(/\b(N\/A|undefined|null|unknown|price|cost|profit|INR|Rs)\b/gi, "")
    //         .replace(/\s+/g, ' ')
    //         .trim();



    //       console.log("engineeringText", engineeringText)
    //       return {
    //         ...furniture,
    //         scopeOfWork: engineeringText || `Technical fabrication and modular assembly executed to precision engineering tolerances and site-specific standards.`
    //       };
    //     } catch (aiError) {
    //       console.error("Engineering AI Generation failed:", aiError);
    //       return {
    //         ...furniture,
    //         scopeOfWork: `Precision manufacturing and modular installation executed as per technical specifications and approved material standards.`
    //       };
    //     }
    //   })
    // );




    //  NEW VERSION

    // --- GEMINI SCOPE OF WORK GENERATION ---
    const furnituresWithAIQuotes = await Promise.all(
      furnitures.map(async (furniture: any, index: number) => {

        await delay(500 * index); // to prevent 429 errors it will be occuring because of calling the gemini api continiously,
        //  it will suspect and it will block us because of rate limiting

        try {
          // 1. Build a clean dataset of ONLY existing Brands and Dimensions
          const technicalData = [];


          // 1. Pre-process Facts for both AI and Fallback
          const plyBrand = furniture?.plywoodBrand;
          const outerBrand = furniture?.outerLaminateBrand;
          const innerBrand = furniture?.innerLaminateBrand;

          // Extract unique brands for fittings and glues just like your render function
          const uniqueFittings = Array.from(new Set(furniture.fittingsAndAccessories?.filter((item: any) => item.brandName).map((item: any) => item.brandName))).join(", ");

          // Dimension logic: Only include if all three parts exist
          const dim = furniture?.dimention || {};
          // const hasDimensions = dim?.width && dim?.height && dim?.depth;
          // if (hasDimensions) {
          //   technicalData.push(`Exact Dimensions: ${dim.width}mm (Width) x ${dim.height}mm (Height) x ${dim.depth}mm (Depth)`);
          // }

          const dimParts = [];
          if (dim.width > 0) dimParts.push(`${dim.width} ft (Width)`);
          if (dim.height > 0) dimParts.push(`${dim.height} ft (Height)`);
          if (dim.depth > 0) dimParts.push(`${dim.depth} ft (Depth)`);
          const hasDim = dimParts.length > 0;


          if (plyBrand) technicalData.push(`Plywood Brand: ${plyBrand}`);
          if (outerBrand) technicalData.push(`Outer Mica Brand: ${outerBrand}`);
          if (innerBrand) technicalData.push(`Inner Mica Brand: ${innerBrand}`);
          if (uniqueFittings) technicalData.push(`Hardware Brands: ${uniqueFittings}`);
          // if (uniqueGlues) technicalData.push(`Adhesive Brands: ${uniqueGlues}`);
          if (hasDim) technicalData.push(`Dimensions: ${dimParts.join(" x ")}`);



          // 2. Construct the Strict Engineering Prompt
          const promptText = `
        Act as a Lead Production Engineer. 
        Write a professional "Execution Scope of Work" based ONLY on 
        ${technicalData.join("\n")}.

      
        Strict Constraints:
        1. ANTI-HALLUCINATION: Use ONLY the specific brands and dimensions provided above. If a brand for a specific category (like Plywood or Hardware) is missing from the facts, DO NOT mention that category or invent a brand.
        1. STARTING RULE: DO NOT start with "Here is," "The scope of work is," "This project involves," or any introductory conversational filler.
        3. VOICE: Use formal engineering passive voice (e.g., "Fabrication is executed," "Surface cladding is applied").
        4. CONTENT: Use ONLY the brands and dimensions provided. Elaborate on their technical application.
        5. FORBIDDEN WORDS: Never use the word "CNC". 
        6. STRUCTURE: Write exactly 4-5 detailed, professional sentences. 
        7. NO LABELS: Do not start sentences with "Plywood:" or "Dimensions:". Integrate them into the flow.
        8. NO COMMERCIALS: Strictly no mention of cost, price, or profit.
        9. NO ITEM NAMES: Do not use the name of the furniture piece.
        10. TONE: The description must sound like an industrial engineering manual, not a sales pitch.
      `;

          const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            config: {
              temperature: 0.7, // Slightly higher for better elaboration on brands
              maxOutputTokens: 400
            },
          });

          const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

          // 3. Final Cleanup
          const engineeringText = text
            .replace(/\b(N\/A|undefined|null|unknown|price|cost|profit|INR|Rs|CNC)\b/gi, "")
            .replace(/\s+/g, ' ')
            .trim();

          console.log("engineeringText", engineeringText);

          return {
            ...furniture,
            scopeOfWork: engineeringText || `Technical execution utilizing ${furniture.plywoodBrand || 'specified'} materials to precision engineering standards.`
          };
        } catch (aiError) {
          // console.error("Engineering AI Generation failed:", aiError);
          // return {
          //   ...furniture,
          //   scopeOfWork: `Precision manufacturing and modular installation executed as per technical specifications and approved material standards.`
          // };


          console.error(`Engineering AI Generation failed for ${furniture.furnitureName}:`, aiError);

          // 1. Extract strictly factual data
          const plyBrand = furniture.plywoodBrand;
          const outerBrand = furniture.outerLaminateBrand;
          const innerBrand = furniture.innerLaminateBrand;

          const dim = furniture.dimention || {};
          // const hasDim = dim.width && dim.height && dim.depth;
          // const dimText = (dim?.width && dim?.height) ? ` with precision dimensions of ${dim?.width}ft x ${dim?.height}ft` : "";

          // 1. Filter dimensions that are present and greater than 0
          const dimParts = [];
          if (dim.width > 0) dimParts.push(`${dim.width} ft (Width)`);
          if (dim.height > 0) dimParts.push(`${dim.height} ft (Height)`);
          if (dim.depth > 0) dimParts.push(`${dim.depth} ft (Depth)`);

          // 2. Build the sentences based ONLY on available facts
          let sentences = [];

          // Sentence 1: Substrate Fact
          sentences.push(
            plyBrand
              ? `Primary structural fabrication utilizes ${plyBrand} substrate to ensure core dimensional stability and load-bearing capacity.`
              : `Structural fabrication is executed using specified core substrates to maintain architectural integrity and load-bearing capacity.`
          );

          // // 2. Construct a non-generic string
          // const manualScope = `Technical execution utilizing ${brandsUsed || 'premium grade materials'} for structural assembly${dimText}. ` +
          //   `The process involves high-pressure lamination and precision edge-sealing to ensure mechanical durability and calibrated site alignment as per engineering standards.`;



          // Sentence 2: Exterior Finish Fact
          sentences.push(
            outerBrand
              ? `The exterior surfaces are finished with ${outerBrand} cladding, applied with industrial-grade bonding for high-wear resistance.`
              : `Exterior surfaces involve technical cladding applied to ensure surface durability and environmental protection.`
          );

          // Sentence 3: Interior/Hardware Fact
          const hardwarePart = uniqueFittings ? ` and integrated with ${uniqueFittings} hardware systems` : "";

          sentences.push(
            innerBrand
              ? `Internal reinforcement includes ${innerBrand} liner application${hardwarePart} to achieve a balanced moisture-resistant seal.`
              : `Internal reinforcement utilizes technical liners to maintain structural equilibrium and protect internal surfaces.`
          );


          // Sentence 4: Hardware Fittings Fact (Now always shows if available)
          if (uniqueFittings) {
            sentences.push(`Mechanical integration is completed using ${uniqueFittings} hardware systems, specifically selected for high-cycle operational longevity.`);
          } else {
            sentences.push(`The unit integrates standardized mechanical hardware systems to support essential structural load distribution.`);
          }

          // Sentence 4: Dimension Fact
          // if (hasDim) {
          //   sentences.push(`The unit is manufactured to precise engineering specifications of ${dim.width}mm x ${dim.height}mm x ${dim.depth}mm.`);
          // }


          // Sentence 5: Dynamic Dimension Fact (Strictly Factual & in Feet)
          if (dimParts.length > 0) {
            sentences.push(`The technical assembly is manufactured to precise engineering specifications of ${dimParts.join(" x ")}.`);
          }


          // Sentence 5: Final Execution Fact (Always factual)
          // sentences.push(`Final assembly follows a modular protocol focusing on precision edge-sealing and calibrated site-fitment to meet professional standards.`);


          // Sentence 6: Final Execution Fact (Ensures 4-5 sentences if dimensions are missing)
          // if (!hasDim) {
          //     sentences.push(`Final execution follows a modular installation protocol focusing on precision edge-sealing and calibrated site-fitment.`);
          // }

          // If dimensions were missing, we add one more technical process sentence to reach the 4-5 sentence goal
          // if (!hasDim) {
          //   sentences.push(`Every component is processed to maintain strict mechanical tolerances during the final joinery and onsite installation phase.`);
          // }

          sentences.push(`Final execution follows a modular installation protocol focusing on precision edge-sealing and calibrated site-fitment to meet professional standards.`);

          const manualScope = sentences.join(" ");
          return {
            ...furniture,
            scopeOfWork: manualScope
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





// export const extractQuoteToOrderMaterial = async (req: Request, res: Response): Promise<any> => {

//   try {
//     const { quoteId } = req.params;

//     // 1. Fetch the Internal Quote
//     const quote = await InternalQuoteEntryModel.findById(quoteId);
//     if (!quote) {
//       return res.status(404).json({ message: "Internal Quote not found", ok: false });
//     }

//     const projectId = quote.projectId;

//     // 2. Find or Create Order History for this Project
//     let orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });

//     if (!orderDoc) {

//       const timer = {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//         reminderSent: false,
//       };


//       // Initialize basic structure if not exists
//       orderDoc = new OrderMaterialHistoryModel({
//         projectId,
//         status: "pending",
//         isEditable: true,
//         assignedTo: null,

//         orderedItems: [],
//         timer,
//         deliveryLocationDetails: {
//           siteName: "",
//           address: "",
//           siteSupervisor: "",
//           phoneNumber: "",
//         },
//         currentOrder: {
//           orderMaterialNumber: "",
//           subItems: []
//         },
//         images: [],
//         shopDetails: {
//           shopName: "",
//           address: "",
//           contactPerson: "",
//           phoneNumber: "",
//         },
//         // currentOrder: { subItems: [], orderMaterialNumber: "" },
//         // orderedItems: []
//       });
//     }

//     // 3. Extraction Logic: Prepare Sub-Items
//     const extractedSubItems: any[] = [];
//     let maxNumber = 0;

//     // Helper to find max existing MAT number in current session
//     const calculateMaxNumber = (items: any[]) => {
//       items.forEach((sub: any) => {
//         if (sub.refId) {
//           const num = parseInt(sub.refId.replace(/^\D+/, ""), 10);
//           if (!isNaN(num)) maxNumber = Math.max(maxNumber, num);
//         }
//       });
//     };

//     calculateMaxNumber(orderDoc.currentOrder?.subItems || []);

//     // Function to process items into subItems array
//     const processItem = (itemName: string | null, quantity: number) => {
//       // if (!itemName || !quantity) return;
//       maxNumber++;
//       extractedSubItems.push({
//         subItemName: itemName,
//         refId: `MAT-${maxNumber}`,
//         quantity: quantity,
//         unit: "nos"
//       });
//     };

//     // A. Extract from Furnitures
//     quote.furnitures.forEach(furniture => {
//       // Core Materials (Plywood/Laminate)
//       furniture.coreMaterials.forEach(core => {
//         if (core.plywoodNos?.quantity) processItem(`${core.itemName} (Plywood)`, core.plywoodNos.quantity);
//         // if (core.laminateNos?.quantity) processItem(`${core.itemName} (Laminate)`, core.laminateNos.quantity);
//         // if (core.innerLaminate?.quantity) processItem(`${core.itemName} (Inner Lam)`, core.innerLaminate.quantity);
//         // if (core.outerLaminate?.quantity) processItem(`${core.itemName} (Outer Lam)`, core.outerLaminate.quantity);
//       });

//       // Fittings, Glues, Non-Branded
//       furniture.fittingsAndAccessories.forEach(item => processItem(item.itemName, item.quantity));
//       furniture.glues.forEach(item => processItem(item.itemName, item.quantity));
//       furniture.nonBrandMaterials.forEach(item => processItem(item.itemName, item.quantity));
//     });

//     // B. Extract from Common Materials
//     quote.commonMaterials.forEach(item => processItem(item.itemName, item.quantity));

//     if (extractedSubItems.length === 0) {
//       return res.status(400).json({ message: "No items found in quote to extract", ok: false });
//     }

//     // 4. Generate Order Number (ORD-PROJ-YEAR-XXX)
//     let nextNumber = 1;
//     if (orderDoc.orderedItems && orderDoc.orderedItems.length > 0) {
//       const numbers = orderDoc.orderedItems.map(ele => {
//         const match = ele.orderMaterialNumber?.match(/-(\d+)$/);
//         return match ? parseInt(match[1], 10) : 0;
//       });
//       nextNumber = Math.max(...numbers, 0) + 1;
//     }

//     const currentYear = new Date().getFullYear();
//     const paddedNumber = String(nextNumber).padStart(3, "0");
//     const rawProjectId = projectId.toString().slice(-3);
//     const orderNumber = `ORD-${rawProjectId}-${currentYear}-${paddedNumber}`;

//     // 5. Create New Order Entry
//     const newOrderEntry = {
//       subItems: extractedSubItems,
//       shopDetails: orderDoc.shopDetails || null,
//       deliveryLocationDetails: orderDoc.deliveryLocationDetails || null,
//       images: orderDoc.images || [],
//       pdfLink: [],
//       orderMaterialNumber: orderNumber,
//       createdAt: new Date(),
//       priority: "High",
//       isSyncWithProcurement: false,
//       isPublicOrder: false
//     };

//     // 6. Update Document and increment next order number for CurrentOrder
//     orderDoc.orderedItems.push(newOrderEntry);

//     // Prepare next order number for the UI placeholder
//     const nextPadNumber = String(nextNumber + 1).padStart(3, "0");
//     orderDoc.currentOrder = {
//       subItems: extractedSubItems, // Set extracted items as current working set
//       orderMaterialNumber: `ORD-${rawProjectId}-${currentYear}-${nextPadNumber}`
//     };

//     await orderDoc.save();

//     // 7. Clear Redis Cache
//     await populateWithAssignedToField({
//       stageModel: OrderMaterialHistoryModel,
//       projectId: projectId.toString(),
//       dataToCache: orderDoc
//     });

//     return res.status(200).json({
//       message: "Quote materials extracted and ordered successfully",
//       data: orderDoc,

//       ok: true
//     });

//   } catch (error: any) {
//     console.error("Extraction Error:", error);
//     return res.status(500).json({ message: "Server error during extraction", ok: false });
//   }
// };




//  NEW VERSION



export const extractQuoteToOrderMaterial = async (req: Request, res: Response): Promise<any> => {
  try {
    const { quoteId } = req.params;

    // 1. Fetch from the Quote Variant Model instead of Internal Quote
    const quote = await QuoteVarientGenerateModel.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: "Quote Variant not found", ok: false });
    }

    const projectId = quote.projectId;

    // 2. Find or Create Order History for this Project
    let orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });

    if (!orderDoc) {
      const timer = {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
      };

      orderDoc = new OrderMaterialHistoryModel({
        projectId,
        status: "pending",
        isEditable: true,
        assignedTo: null,
        orderedItems: [],
        timer,
        deliveryLocationDetails: { siteName: "", address: "", siteSupervisor: "", phoneNumber: "" },
        currentOrder: { orderMaterialNumber: "", subItems: [] },
        images: [],
        shopDetails: { shopName: "", address: "", contactPerson: "", phoneNumber: "" },
      });
    }

    // 3. Extraction Logic
    const extractedSubItems: any[] = [];
    let maxNumber = 0;

    const calculateMaxNumber = (items: any[]) => {
      items.forEach((sub: any) => {
        if (sub.refId) {
          const num = parseInt(sub.refId.replace(/^\D+/, ""), 10);
          if (!isNaN(num)) maxNumber = Math.max(maxNumber, num);
        }
      });
    };

    calculateMaxNumber(orderDoc.currentOrder?.subItems || []);

    const processItem = (itemName: string | null, quantity: number) => {
      if (!itemName) return;
      maxNumber++;
      extractedSubItems.push({
        subItemName: itemName.trim(),
        refId: `MAT-${maxNumber}`,
        quantity: quantity,
        unit: "nos"
      });
    };

    // A. Extract from Furnitures with Brand Names
    quote.furnitures.forEach(furniture => {
      // Casting to any to access the brand strings defined in QuoteFurnitureSchema
      const f = furniture as any;

      const pBrand = f.plywoodBrand ? ` - ${f.plywoodBrand}` : "";
      const iBrand = f.innerLaminateBrand ? ` - ${f.innerLaminateBrand}` : "";
      const oBrand = f.outerLaminateBrand ? ` - ${f.outerLaminateBrand}` : "";

      // Loop through coreMaterials inside this furniture
      furniture.coreMaterials.forEach(core => {
        // 1. Plywood: Uses the furniture-level plywoodBrand
        if (core.plywoodNos?.quantity) {
          processItem(`${core.itemName} (Plywood${pBrand})`, core.plywoodNos.quantity);
        }

        // 2. Inner Laminate: Uses the furniture-level innerLaminateBrand
        if (core.innerLaminate?.quantity) {
          processItem(`${core.itemName} (Inner Laminate${iBrand})`, core.innerLaminate.quantity);
        }

        // 3. Outer Laminate: Uses the furniture-level outerLaminateBrand
        if (core.outerLaminate?.quantity) {
          processItem(`${core.itemName} (Outer Laminate${oBrand})`, core.outerLaminate.quantity);
        }
      });

      // Fittings, Glues, Non-Branded (These usually have brandName in QuoteSimpleItemSchema)
      furniture.fittingsAndAccessories.forEach(item => {
        const brand = item.brandName ? ` (${item.brandName})` : "";
        processItem(`${item.itemName}${brand}`, item.quantity);
      });

      furniture.glues.forEach(item => {
        const brand = item.brandName ? ` (${item.brandName})` : "";
        processItem(`${item.itemName}${brand}`, item.quantity);
      });

      furniture.nonBrandMaterials.forEach(item => {
        processItem(item.itemName, item.quantity);
      });
    });

    // B. Extract from Common Materials
    quote.commonMaterials.forEach(item => {
      const brand = item.brandName ? ` (${item.brandName})` : "";
      processItem(`${item.itemName}${brand}`, item.quantity);
    });

    if (extractedSubItems.length === 0) {
      return res.status(400).json({ message: "No items found in quote to extract", ok: false });
    }

    // 4. Generate Order Number
    let nextNumber = 1;
    if (orderDoc.orderedItems && orderDoc.orderedItems.length > 0) {
      const numbers = orderDoc.orderedItems.map(ele => {
        const match = ele.orderMaterialNumber?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNumber = Math.max(...numbers, 0) + 1;
    }

    const currentYear = new Date().getFullYear();
    const paddedNumber = String(nextNumber).padStart(3, "0");
    const rawProjectId = projectId.toString().slice(-3);
    const orderNumber = `ORD-${rawProjectId}-${currentYear}-${paddedNumber}`;

    // 5. Create Entry
    const newOrderEntry = {
      subItems: extractedSubItems,
      shopDetails: orderDoc.shopDetails || null,
      deliveryLocationDetails: orderDoc.deliveryLocationDetails || null,
      images: orderDoc.images || [],
      pdfLink: [],
      orderMaterialNumber: orderNumber,
      createdAt: new Date(),
      priority: "High",
      isSyncWithProcurement: false,
      isPublicOrder: false
    };

    // 6. Update History
    orderDoc.orderedItems.push(newOrderEntry);
    const nextPadNumber = String(nextNumber + 1).padStart(3, "0");
    orderDoc.currentOrder = {
      subItems: [],
      orderMaterialNumber: `ORD-${rawProjectId}-${currentYear}-${nextPadNumber}`
    };

    await orderDoc.save();

    // 7. Cache Sync
    await populateWithAssignedToField({
      stageModel: OrderMaterialHistoryModel,
      projectId: projectId.toString(),
      dataToCache: orderDoc
    });

    return res.status(200).json({
      message: "Variant materials extracted successfully",
      data: orderDoc,
      ok: true
    });

  } catch (error: any) {
    console.error("Extraction Error:", error);
    return res.status(500).json({ message: "Server error during extraction", ok: false });
  }
};