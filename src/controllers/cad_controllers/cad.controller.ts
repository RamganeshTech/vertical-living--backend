// controllers/layoutController.js
import { GoogleGenAI } from "@google/genai";
import { Response, Request } from "express";
import { CategoryModel, ItemModel } from "../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import { jsonrepair } from 'jsonrepair';
// import fs from "fs";
// import { CategoryModel, ItemModel } from "../models/MaterialModel"; // Adjust paths as needed

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// export const extractLayoutDetails = async (req: Request, res: Response): Promise<any> => {
//     try {
//         if (!req.file) return res.status(400).json({ error: "No file uploaded" , ok:false});
//         console.log("req.file", req.file)

//         // Convert the S3 buffer to Base64
//         const base64Data = req.file.buffer.toString("base64");



//         // 2. Updated Prompt to include Doors and Windows as requested
//         // STEP 1: Highly detailed prompt using the PDF's specific markers
//         // const prompt = `
//         //     ACT AS: Professional Architectural Quantity Surveyor.
//         //     TASK: Extract a detailed Bill of Quantities from this CAD PDF.

//         //     REFERENCE MARKERS IN DRAWING:
//         //     1. Find the "LEGEND" table (usually bottom right) to identify codes like MT-1, CH-2.
//         //     2. Scan the "GROUND FLOOR FURNITURE PLAN" for room names (e.g., ADMIN, CANTEEN).
//         //     3. Count all furniture symbols within each room boundary.
//         //     4. Count all Door symbols (swings) and Window symbols.

//         //     OUTPUT RULES:
//         //     - Return ONLY valid JSON.
//         //     - If a room has no furniture, still list the room with an empty inventory.
//         //     - "item" should be the full description from the legend.
//         //     - "code" should be the short ID (e.g., MT-1).

//         //     JSON STRUCTURE:
//         //     {
//         //         "rooms": [
//         //             {
//         //                 "room_name": "string",
//         //                 "inventory": [
//         //                     { "item": "string", "code": "string", "quantity": number }
//         //                 ]
//         //             }
//         //         ]
//         //     }
//         // `;



//         const prompt = `
//             ACT AS: Senior Architectural Auditor & Quantity Surveyor.
//             OBJECTIVE: Perform a comprehensive "Takeoff" from this architectural layout. 

//             EXTRACTION RULES (DOMAIN-AGNOSTIC):
//             - DO NOT rely on a fixed "Legend" or "Schedule" header. 
//             - IDENTIFY all textual annotations, codes (e.g., MT-1, D1, W2), and spatial labels.
//             - MAP codes to descriptions by finding matching text anywhere on the sheet.
//             - EXTRACT all physical dimensions (Length, Breadth, Width, Height) and spatial areas mentioned.
//             - COUNT items per room based on visual proximity and boundary lines.

//             JSON DATA STRUCTURE REQUIREMENTS:
//             - Return a JSON object with a "rooms" array.
//             - "room_metadata": Include any overall room details like area, floor finish, or ceiling height.
//             - "inventory": For every item, include "code", "description", "quantity", and "specs" (an object for dimensions/materials).

//             OUTPUT FORMAT:
//             {
//                 "project_info": { "drawing_name": "string", "scale": "string" },
//                 "rooms": [
//                     {
//                         "room_name": "string",
//                         "room_metadata": { "area": "string", "height": "string", "other": "any" },
//                         "inventory": [
//                             { 
//                                 "item": "string", 
//                                 "code": "string", 
//                                 "quantity": number,
//                                 "specs": { "length": "string", "width": "string", "height": "string", "material": "string" }
//                             }
//                         ]
//                     }
//                 ]
//             }
//         `;

//    const response = await genAI.models.generateContent({
//             model: "gemini-2.0-flash",
//             contents: [{
//                 role: 'user',
//                 parts: [
//                     { 
//                         inlineData: { 
//                             data: base64Data, 
//                             mimeType: "application/pdf" 
//                         } 
//                     },
//                     { text: prompt }
//                 ]
//             }],
//             config: {
//                 responseMimeType: "application/json",
//                 temperature: 0.0
//             }
//         });


//         res.status(200).json({
//             ok: true,
//             data: JSON.parse(response.text ?? "{}") // In the new SDK, it's response.text, not response.text()
//         });

//         // Cleanup local temp file
//         // fs.unlinkSync(req.file.path);

//     } catch (error:any) {
//         console.error("Extraction Error:", error);
//         res.status(500).json({message: "internal error ocuured", error: error?.message, ok: false  });
//     }
// };


/**
 * Utility to find a value in a record regardless of case (Rs, rs, RS, etc.)
 */
const getDynamicValue = (data: Record<string, any>, targetKey: string) => {
    const normalizedKey = targetKey.toLowerCase();
    const actualKey = Object.keys(data).find(k => k.toLowerCase() === normalizedKey);
    return actualKey ? data[actualKey] : null;
};

export const extractLayoutDetails = async (req: Request, res: Response): Promise<any> => {
    try {

        const { organizationId } = req.params;
        if (!req.file || !req.file.buffer) return res.status(400).json({ error: "No file uploaded", ok: false });

        const base64Data = req.file.buffer.toString("base64");

        // const prompt = `
        //     ACT AS: Senior Construction Estimator & Quantity Surveyor.
        //     TASK: Perform a detailed "Trade-Based Takeoff" from this interior layout PDF.

        //     1. IDENTIFY TRADES: Categorize every item/annotation into specific work types: 
        //        - "Glass Work" (Partitions, Windows, Glass doors)
        //        - "Carpentry/Furniture Work" (Tables, Chairs, Storage, Paneling)
        //        - "False Ceiling Work" (Gypsum, Acoustical panels)
        //        - "Civil/Plumbing Work" (Walls, partitions, toilets)

        //     2. DATA EXTRACTION RULES:
        //        - ROOMS: Detect every room name (e.g., ADMIN, CANTEEN, OHC).
        //        - DIMENSIONS: Extract full dimensions (LxBxH) if mentioned (e.g., 2100x1800x800).
        //        - CODES: Map codes (MT-1, CH-2) to full descriptions from any text on the sheet.
        //        - QUANTITY: Scan the pdf, count every visual occurrence of the symbol/code within the room boundaries; return the total count as a number where you need ot check for the quantity field and you need ot map that to the corresponding material.
        //        - UOM: Identify the Unit of Measure (NOS, SQFT, RFT).

        //     3. OUTPUT FORMAT (STRICT JSON):
        //     {
        //       "project_name": "string",
        //       "works": [
        //         {
        //           "work_type": "Glass Work | Carpentry Work | False Ceiling | etc.",
        //           "rooms": [
        //             {
        //               "room_name": "string",
        //               "items": [
        //                 {
        //                   "s_no": "string (code like MT-1)",
        //                   "description": "Full item description including LxBxH specs",
        //                   "location": "Specific area in room",
        //                   "quantity": number,
        //                   "uom": "string (NOS/SQFT/etc)",
        //                   "price": null,
        //                   "total_price": null,
        //                   "metadata": { "l": "string", "b": "string", "h": "string" }
        //                 }
        //               ]
        //             }
        //           ]
        //         }
        //       ],
        //       "extraction_warnings": ["List items or dimensions you couldn't clearly identify"]
        //     }
        // `;


        // ------------------------------------------------------------------
        // THE "DEEP SCAN" PROMPT (Optimized for PDF Diagrams)
        // ------------------------------------------------------------------
        const prompt = `
            ACT AS: Expert Senior Quantity Surveyor & Construction Estimator.
            TASK: Perform a 100% comprehensive "Takeoff" from the Architectural Diagrams in this PDF.

            CRITICAL INSTRUCTION: DO NOT SUMMARIZE. I need every single item detailed.

            [CRITICAL RULE: OUTPUT ONLY RAW JSON]
1. DO NOT PROVIDE ANY PREAMBLE, INTRODUCTION, OR OUTRO.
2. DO NOT EXPLAIN YOUR STEPS OR REASONING.
3. START YOUR RESPONSE IMMEDIATELY WITH '{' AND END WITH '}'.
4. IF THE DATA IS EXTENSIVE, BE CONCISE IN DESCRIPTIONS TO ENSURE THE JSON COMPLETES.
            
            --- SCANNING STRATEGY ---
            1. VISUAL GRID SCAN: Mentally divide the page into 4 quadrants (Top-Left, Top-Right, etc.) and scan each sector for details.
            2. DIAGRAM FOCUS: Look specifically at the DRAWING LINES, SYMBOLS, and DIMENSION TEXT. Do not just read the main titles.
            3. SYMBOL COUNTING: If you see 6 chairs drawn around a table, count them as "6". If you see a code like "MT-1" appearing 10 times, count it as 10.

            --- DATA EXTRACTION RULES ---
            
            STEP 1: ROOM IDENTIFICATION
            - Identify every room (e.g., "Office", "Canteen", "Reception").
            - If the Room Name is missing, INFER IT from the furniture (e.g., "Bunk Bed" = Creche, "Server Rack" = Server Room).

            STEP 2: TRADE CATEGORIZATION
            Group all findings into these specific "work_type" categories:
            - "Carpentry/Furniture Work": Tables (MT-1), Chairs (CH-1), Storage (RC-1), Paneling.
            - "Glass Work": Partitions (TP-1), Glass Doors (GD-1), Windows.
            - "False Ceiling Work": Mineral Fibre (MF), Metal Grid (MG), Gypsum.
            - "Civil/Plumbing Work": Walls (100mm/200mm), Flooring (Carpet, Tiles).

            STEP 3: ITEM & METADATA DETAILS
            For every item found:
            - "s_no": Extract the code (e.g., "MT-1", "W-1").
            - "description": Combine the text label + any nearby dimension notes (e.g., "Modular Table 1200x600mm").
            - "quantity": The visual count of symbols.
            - "metadata": EXTRACT DIMENSIONS. If text says "1200x600", set { "l": "1200", "b": "600" }.

            STEP 4: OUTPUT FORMAT (STRICT JSON)
            Return ONLY this JSON. No markdown, no explanations.
            {
              "project_name": "string",
              "works": [
                {
                  "work_type": "string",
                  "rooms": [
                    {
                      "room_name": "string",
                      "items": [
                        {
                          "s_no": "string", 
                          "description": "string", 
                          "location": "string", 
                          "quantity": number,
                          "uom": "string", // Defaults: "NOS" for furniture, "SQFT" for flooring/glass/walls
                          "price": null,
                          "total_price": null,
                          "metadata": { "l": "string", "b": "string", "h": "string" }
                        }
                      ]
                    }
                  ]
                }
              ],
              "extraction_warnings": ["string"]
            }
        `;

        const result = await genAI.models.generateContent({
            // model: "gemini-2.0-flash",
            // model: "gemini-2.5-flash",
            model: "gemini-3-flash-preview",

            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: "application/pdf" } },
                    { text: prompt }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.1,
                // maxOutputTokens: 8192, // Increase this to allow longer responses
            }
        });

        // const rawResult = JSON.parse(response.text || "{}");
        // 3. Properly invoke the function and clean the string
        // const response = await result.response;
        // const textResponse = result.response.text();
        // const textResponse = response.text(); // It is a function!
        // const textResponse = result.text();

        // 2. Access the text safely. 
        // If your IDE says it's a property, use it without (); 
        // if it says it's a function, use ().
        // Safest way for your specific error:
        console.log("result from model", result)
        // FIX: Access candidates directly from 'result', not 'result.response'
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error("No candidates returned from the model.");
        }


        console.log("result candidates", result.candidates)
        // Access the text from the first candidate
        const textResponse = (result as any)?.candidates[0]?.content?.parts[0]?.text;
        console.log("textResponse", textResponse)

        // if (!textResponse) {
        //     throw new Error("Model returned an empty text response.");
        // }

        // // 4. Robust JSON extraction
        // const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        // if (!jsonMatch) {
        //     throw new Error("Model did not return a valid JSON block.");
        // }

        // const rawResult = JSON.parse(jsonMatch[0].trim());


        // ... inside your try block ...
        // const textResponse = result.candidates[0].content.parts[0].text;

        // 1. Check if the model hit the limit (VERY IMPORTANT)
        if (result.candidates[0].finishReason === 'MAX_TOKENS') {
            console.warn("CRITICAL: AI cut off mid-sentence. Repairing JSON...");
        }

        // 2. Extract and Repair
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/) || [textResponse];
        let repairedJson = jsonMatch[0];
        console.log("respairedJSON 111", repairedJson)
        try {
            const finalStatus = result.candidates[0].finishReason === 'MAX_TOKENS' 
    ? "partial_success" 
    : "success";
            // This will add missing ] and } automatically
            repairedJson = jsonrepair(repairedJson);
            console.log("repairedJson 222", repairedJson)
            const rawResult = JSON.parse(repairedJson);

            // Now proceed with your pricing logic
            res.status(200).json({ ok: true, data: rawResult, status: finalStatus });
        } catch (error) {
            console.error("Repair failed. The cutoff was too severe.");
            res.status(500).json({ error: "PDF too complex for single pass." });
        }



        // NOTE: In the future, you will loop through rawResult.works[i].rooms[j].items 
        // to query your 'rateconfig' model and populate the 'price' fields.

        // 2. START DYNAMIC PRICING CALCULATION
        // if (rawResult.works && organizationId) {
        //     for (const work of rawResult.works) {
        //         // Find Category (e.g., "Glass") matching the work_type
        //         const category = await CategoryModel.findOne({
        //             organizationId,
        //             name: { $regex: new RegExp(work.work_type.split('/')[0].split(' ')[0], "i") }
        //         });

        //         if (!category) continue;

        //         // Fetch all price items for this category
        //         const priceList = await ItemModel.find({ organizationId, categoryId: category._id });

        //         for (const room of work.rooms) {
        //             for (const item of room.items) {
        //                 // Semantic Match: Does item description contain the Brand or Type from DB?
        //                 const priceMatch = priceList.find(p => {
        //                     const dbItemName = (getDynamicValue(p.data, "brand") || getDynamicValue(p.data, "Glass Partition Type") || "").toString().toLowerCase();
        //                     return item.description.toLowerCase().includes(dbItemName);
        //                 });

        //                 if (priceMatch) {
        //                     const rate = parseFloat(getDynamicValue(priceMatch.data, "rs") || getDynamicValue(priceMatch.data, "rate") || 0);
        //                     const unit = (getDynamicValue(priceMatch.data, "unit") || "nos").toString().toLowerCase();

        //                     item.price = rate;
        //                     item.uom = unit.toUpperCase();

        //                     // DYNAMIC UNIT ENGINE (Supports SQFT, KG, DOZENS, NOS, etc.)
        //                     if (unit === "sqft" || unit === "sqm") {
        //                         const l = parseFloat(item.metadata.l) || 0;
        //                         const b = parseFloat(item.metadata.b) || 0;
        //                         // Convert mm to sqft if necessary (factor: 92903.04)
        //                         const area = (l * b) / 92903.04;
        //                         item.total_price = Number((area * rate).toFixed(2));
        //                     } else {
        //                         // Default for NOS, KG, DOZENS, PIECES
        //                         item.total_price = Number((item.quantity * rate).toFixed(2));
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }

        // res.status(200).json({
        //     ok: true,
        //     data: rawResult
        // });

    } catch (error: any) {
        console.error("Extraction Error:", error);
        res.status(500).json({ message: "Internal error occurred during extraction", error: error?.message, ok: false });
    }
};