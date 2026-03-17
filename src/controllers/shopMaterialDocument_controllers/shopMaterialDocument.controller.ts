import { Request, Response } from 'express';
import { MaterialShopDocumentModel } from '../../models/ShopMaterial_document_model/shopMaterialDocument.model';
// import { MaterialShopDocumentModel } from '../models/MaterialShopDocument'; // Adjust path
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import { CategoryModel, ItemModel } from '../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model';
import { PDFDocument } from 'pdf-lib';
dotenv.config()


const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,



});


export const createMaterialShopDocuments = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryName, materialCategoryId, organizationId } = req.body;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No PDF/Image files provided.", ok: false });
    }

    if (!organizationId) return res.status(400).json({ message: "Organization ID is required.", ok: false });

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required.", ok: false });
    }

    // // 2. Validate materialCategoryId
    // if (!materialCategoryId) {
    //   return res.status(400).json({ message: "Material Category ID is required to link schema.", ok: false });
    // }


    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    // const categoryObjectId = new mongoose.Types.ObjectId(materialCategoryId);
    const trimmedCategory = categoryName.trim();

    // 2. Check for Duplicate Category (Case-Insensitive)
    const existingCategory = await MaterialShopDocumentModel.findOne({
      organizationId: orgObjectId,

      categoryName: { $regex: new RegExp(`^${trimmedCategory}$`, 'i') }
    });

    if (existingCategory) {
      // Throw error if category already exists
      return res.status(400).json({
        message: `The category "${trimmedCategory}" already exists. Please select it from the list or use a different name.`,
        ok: false
      });
    }


    // Add this log to your controller to verify S3 is returning the URL
    // console.log("Uploaded Files from S3:", files.map(f => ({ name: f.originalname, url: f.location })));


    // Map each file to the MaterialShopDocument structure
    // const documentData = files.map(file => {
    //   const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";

    //   return {
    // categoryName,
    //     file: {
    //       type,
    //       url: file.location, // S3 URL from Multer-S3
    //       originalName: file.originalname,
    //       uploadedAt: new Date()
    //     }
    //   };
    // });




    // Bulk insert all files as individual documents
    // const savedDocuments = await MaterialShopDocumentModel.insertMany(documentData);


    // Map all uploaded files into the IMaterialFile structure
    const mappedFiles = files.map(file => ({
      type: file.mimetype.startsWith("image") ? "image" : "pdf",
      url: file.location,
      originalName: file.originalname,
      uploadedAt: new Date(),
      isExtracted: false
    }));


    // Create ONE document with the array of files
    const savedDocument = await MaterialShopDocumentModel.create({
      organizationId: orgObjectId,
      // materialCategoryId: categoryObjectId || null,
      categoryName,
      file: mappedFiles, // Stores the whole array
      extractDetails: []
    });

    return res.status(201).json({
      message: `documents uploaded successfully.`,
      data: savedDocument,
      ok: true
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: "Server error during file upload", ok: false });
  }
};


export const createMaterialShopDocumentsV1 = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryName, materialCategoryId, organizationId } = req.body;
    const files = req.files as (Express.Multer.File & { location: string })[];

    // 1. Initial Validations
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No PDF/Image files provided.", ok: false });
    }
    if (!organizationId) return res.status(400).json({ message: "organizationId is required.", ok: false });
    if (!categoryName) return res.status(400).json({ message: "categoryName is required.", ok: false });
    if (!materialCategoryId) return res.status(400).json({ message: "materialCategoryId is required.", ok: false });

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const categoryObjectId = new mongoose.Types.ObjectId(materialCategoryId);
    const trimmedCategory = categoryName.trim();

    // 2. Map new files into the IMaterialFile structure
    const mappedFiles = files.map(file => ({
      type: file.mimetype.startsWith("image") ? "image" : "pdf",
      url: file.location,
      originalName: file.originalname,
      uploadedAt: new Date(),
      isExtracted: false
    }));

    // 3. UPSERT LOGIC: Find existing or create new
    // We search by organizationId and materialCategoryId (the source of truth)
    const existingDocument = await MaterialShopDocumentModel.findOne({
      organizationId: orgObjectId,
      materialCategoryId: categoryObjectId
    });

    if (existingDocument) {
      // --- UPDATE CASE: Push new files to the existing array ---
      existingDocument.file.push(...mappedFiles);
      // Optional: Update the name in case it was edited in RateConfig
      existingDocument.categoryName = trimmedCategory;

      await existingDocument.save();

      return res.status(200).json({
        message: `Files successfully added to existing category: ${trimmedCategory}`,
        data: existingDocument,
        ok: true
      });
    } else {


      // --- CREATE CASE: Create the first document for this category ---
      const savedDocument = await MaterialShopDocumentModel.create({
        organizationId: orgObjectId,
        materialCategoryId: categoryObjectId,
        categoryName: trimmedCategory,
        file: mappedFiles,
        extractDetails: []
      });

      return res.status(201).json({
        message: `New catalogue created and files uploaded successfully.`,
        data: savedDocument,
        ok: true
      });
    }

  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: "Server error during file upload", ok: false });
  }
};


export const editMaterialShopCategoryName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { categoryName, organizationId } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: "Category name cannot be empty.", ok: false });
    }

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required.", ok: false });
    }

    const trimmedName = categoryName.trim();
    const orgObjectId = new mongoose.Types.ObjectId(organizationId as string);

    // 1. Check if the new name is already taken by ANOTHER document
    const duplicateCheck = await MaterialShopDocumentModel.findOne({
      organizationId: orgObjectId,
      _id: { $ne: id }, // Exclude the current document
      categoryName: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (duplicateCheck) {
      return res.status(400).json({
        message: `The category "${trimmedName}" already exists. Please choose a unique name.`,
        ok: false
      });
    }

    // 2. Perform the update
    const updatedDocument = await MaterialShopDocumentModel.findByIdAndUpdate(
      id,
      { categoryName: trimmedName },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Category record not found.", ok: false });
    }

    return res.status(200).json({
      message: "Category name updated successfully.",
      data: updatedDocument,
      ok: true
    });

  } catch (error) {
    console.error("Edit Category Error:", error);
    return res.status(500).json({ message: "Server error during category update", ok: false });
  }
};


export const updateFilesToMaterialDocument = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No new files provided.", ok: false });
    }

    // Map new files
    const newFiles = files.map(file => ({
      type: file.mimetype.startsWith("image") ? "image" : "pdf",
      url: file.location,
      originalName: file.originalname,
      uploadedAt: new Date(),
      isExtracted: false

    }));

    // Update the existing document by pushing new files into the array
    const updatedDocument = await MaterialShopDocumentModel.findByIdAndUpdate(
      id,
      { $push: { file: { $each: newFiles } } },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document record not found", ok: false });
    }

    return res.status(200).json({
      message: "New files added to the category.",
      data: updatedDocument,
      ok: true
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error during update", ok: false });
  }
};


export const getAllMaterialShopDocuments = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryName, organizationId, page = 1, limit = 10 } = req.query;

    // Build Filter
    const filter: any = {};

    // if (organizationId) filter.organizationId = organizationId

    // 2. Organization Filter with ObjectId conversion
    if (organizationId) {
      // Convert to ObjectId to ensure the index is used effectively
      filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
    }


    if (categoryName) {
      // Using regex for partial match, or just { categoryName } for exact
      filter.categoryName = { $regex: categoryName, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const documents = await MaterialShopDocumentModel.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(Number(limit));

    const total = await MaterialShopDocumentModel.countDocuments(filter);

    return res.status(200).json({
      ok: true,
      data: documents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching documents", ok: false });
  }
};



export const getMaterialShopDocumentById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const document = await MaterialShopDocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found", ok: false });
    }

    return res.status(200).json({ ok: true, data: document });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving document", ok: false });
  }
};


export const getMaterialShopDocumentByIdV1 = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;
    const document = await MaterialShopDocumentModel.findOne({ materialCategoryId: categoryId });

    // if (!document) {
    //   return res.status(404).json({ message: "Document not found", ok: false });
    // }

    return res.status(200).json({ ok: true, data: document });
  } catch (error: any) {
    return res.status(500).json({ error: "Error retrieving document", message: error?.message, ok: false });
  }
};


export const deleteMaterialShopDocument = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const deletedDoc = await MaterialShopDocumentModel.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found", ok: false });
    }

    return res.status(200).json({
      message: "Document deleted successfully",
      ok: true
    });
  } catch (error) {
    return res.status(500).json({ message: "unable to delete document", ok: false });
  }
};



export const deleteMaterialShopFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId, fileId } = req.params; // id = category document ID, fileId = specific file ID

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required.", ok: false });
    }

    if (!fileId) {
      return res.status(400).json({ message: "fileId is required.", ok: false });
    }


    // Use $pull to remove the specific file from the array
    const updatedDocument = await MaterialShopDocumentModel.findByIdAndUpdate(
      categoryId,
      { $pull: { file: { _id: fileId } } },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Record not found or unauthorized.", ok: false });
    }

    return res.status(200).json({
      message: "File deleted successfully.",
      data: updatedDocument,
      ok: true
    });

  } catch (error: any) {
    console.error("Delete File Error:", error);
    return res.status(500).json({ message: "Server error during file deletion", error: error?.message, ok: false });
  }
};




//  EXTRACTION

export const extractShopMaterialDocDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, fileId } = req.params;


    // 1. Find the document
    const document = await MaterialShopDocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found or no file attached", ok: false });
    }


    const targetFile = document.file.find((f: any) => f._id.toString() === fileId);

    if (!targetFile || !targetFile.url) {
      return res.status(404).json({ message: "Specific file not found in this category", ok: false });
    }

    // --- STEP 2: Fetch file and convert to Base64 (Crucial for AI to see it) ---
    const fileResponse = await axios.get(targetFile.url, { responseType: 'arraybuffer' });
    const base64Data = Buffer.from(fileResponse.data).toString('base64');
    // const mimeType = document.file.type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const mimeType = targetFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';

    // 3. Construct the prompt
    const promptText = `
      You are an expert at reading shop receipts and electrical material bills.
      Analyze the attached document. 
      Extract a list of items. For each item, identify the Brand name and the Item Name.
      Return the data strictly as a JSON array of objects with the keys "brand" and "itemName".
      Example format: [{"brand": "Havells", "itemName": "1.5sqmm Wire"}]
      If no brand is found, use "Generic". 
      Only return the JSON array, no other text.
    `;

    // 4. Use your preferred Gemini syntax
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 8192
      },
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";


    // 🔹 DEBUG LOGS
    console.log("--- AI RAW RESPONSE START ---");
    console.log(responseText);
    console.log("--- AI RAW RESPONSE END ---");

    const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    // 5. Parse the JSON from Gemini
    let extractedData = [];
    try {

      // Try to find the start [ and end ]
      const startIndex = cleanText.indexOf("[");
      const endIndex = cleanText.lastIndexOf("]");

      if (startIndex !== -1 && endIndex !== -1) {
        const jsonArrayString = cleanText.substring(startIndex, endIndex + 1);
        extractedData = JSON.parse(jsonArrayString);
      } else {
        console.error("No valid JSON array found in response");
      }


      // const jsonMatch = responseText.match(/\[.*\]/s);
      // console.log("Regex Match Result:", jsonMatch ? jsonMatch[0] : "No Match Found");
      // extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (parseError) {
      console.error("Parsing failed. AI Response was likely cut off again.");
      console.error("JSON Parsing Error:", parseError);
      return res.status(500).json({ message: "AI returned invalid data format", ok: false });
    }

    // 6. Update the Database
    // document.extractDetails = extractedData;
    document.extractDetails = [...document.extractDetails, ...extractedData];

    // Update the specific file's status to isExtracted: true
    // const fileIndex = document.file.findIndex((f) => f._id.toString() === fileId);
    // if (fileIndex !== -1) {
    //   document.file[fileIndex].isExtracted = true;
    // }

    targetFile.isExtracted = true



    await document.save();

    return res.status(200).json({
      message: "Data extracted successfully",
      data: document,
      ok: true
    });

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    return res.status(500).json({ message: error.message || "Extraction failed", ok: false });
  }
};




// export const extractShopMaterialDocDetailsv1 = async (req: Request, res: Response): Promise<any> => {



//   try {
//     const { id, fileId, categoryId, organizationId } = req.params;


//     // Modified Step 1 for better multi-tenant security
//     const [document, category] = await Promise.all([
//       MaterialShopDocumentModel.findOne({ _id: id, organizationId: organizationId }),
//       CategoryModel.findOne({ _id: categoryId, organizationId: organizationId })
//     ]);

//     if (!document || !category) {
//       return res.status(404).json({ message: "Document or Category not found", ok: false });
//     }

//     const targetFile = document.file.find((f: any) => f._id.toString() === fileId);
//     if (!targetFile || !targetFile.url) {
//       return res.status(404).json({ message: "File not found", ok: false });
//     }

//     // 2. Identify keys to extract (visibleIn: "material")
//     const extractionFields = category.fields.filter(f => f.visibleIn?.includes("material"));
//     const extractionKeys = extractionFields.map(f => f.key);

//     // Define default values based on category schema types
//     const defaultValues = category.fields.reduce((acc, field) => {
//       if (field.type === "number") acc[field.key] = 0;
//       else if (field.type === "boolean") acc[field.key] = false;
//       else acc[field.key] = null;
//       return acc;
//     }, {} as Record<string, any>);

//     // 3. Prepare File for AI
//     const fileResponse = await axios.get(targetFile.url, { responseType: 'arraybuffer' });
//     const base64Data = Buffer.from(fileResponse.data).toString('base64');
//     const mimeType = targetFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';

//     // 4. Construct Dynamic Prompt
//     const promptText = `
//             Analyze this ${targetFile.type} document for a "${category.name}" category.
//             Extract a list of items. For each item, return a JSON object with these keys: ${extractionKeys.join(", ")}.
//             Return strictly a JSON array. If a value is missing, return null.
//             Format: [{"${extractionKeys[0]}": "value", ...}]
//         `;

//     // 5. Call Gemini
//     const result = await genAI.models.generateContent({
//       model: "gemini-2.0-flash-lite",
//       // model: "gemini-1.5-flash",
//       contents: [{
//         role: 'user',
//         parts: [
//           { text: promptText },
//           { inlineData: { data: base64Data, mimeType: mimeType } }
//         ]
//       }],
//       config: { temperature: 0.1, maxOutputTokens: 8192 }
//     });

//     const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
//     const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();



//     // 🔹 DEBUG LOGS
//     console.log("--- AI RAW RESPONSE START ---");
//     console.log(responseText);
//     console.log("--- AI RAW RESPONSE END ---");



//     let aiExtractedItems = [];
//     try {
//       const start = cleanText.indexOf("[");
//       const end = cleanText.lastIndexOf("]");
//       aiExtractedItems = JSON.parse(cleanText.substring(start, end + 1));
//     } catch (e) {
//       return res.status(500).json({ message: "AI Parsing Error", ok: false });
//     }

//     // 6. Map to ItemModel and Append to Database (OLD VERSION)
//     // const itemsToSave = aiExtractedItems.map((item: any) => ({
//     //   organizationId: organizationId,
//     //   categoryId: category._id,
//     //   categoryName: category.name,
//     //   data: {
//     //     ...defaultValues, // Fill all category fields with defaults first
//     //     ...item           // Overwrite with AI extracted data
//     //   }
//     // }));

//     // // Bulk insert the new items
//     // await ItemModel.insertMany(itemsToSave);

//     // 6. 🛡️ STRICT VALIDATION & MAPPING (NEW VERSION)
//     const itemsToSave = aiExtractedItems.map((aiItem: any) => {
//       const filteredData: Record<string, any> = { ...defaultValues };

//       // Only allow keys that exist in extractionKeys
//       extractionKeys.forEach((key) => {
//         if (aiItem.hasOwnProperty(key)) {
//           filteredData[key] = aiItem[key];
//         }
//       });

//       return {
//         organizationId: organizationId,
//         categoryId: category._id,
//         categoryName: category.name,
//         data: filteredData // This now ONLY contains valid category keys
//       };
//     });


//     // 7. Bulk insert and capture the created documents
//     let createdItems: any[] = [];
//     // Bulk insert the validated items
//     if (itemsToSave.length > 0) {
//       createdItems = await ItemModel.insertMany(itemsToSave);
//     }

//     // Update the source document file status
//     targetFile.isExtracted = true;
//     await document.save();

//     return res.status(200).json({
//       message: `Successfully extracted ${itemsToSave.length} items for ${category.name}`,
//       data: {
//         document: document,
//         items: createdItems
//       },
//       ok: true
//     });

//   } catch (error: any) {
//     console.error("Extraction Error:", error);
//     // return res.status(500).json({ message: error.message, ok: false });

//     // ✅ Detect Vertex/Gemini 429
//     const errorMessage =
//       error?.response?.data?.error?.message ||
//       error?.message ||
//       "Something went wrong";



//     const errorCode =
//       error?.response?.data?.error?.code ||
//       error?.response?.status;

//     // 🔥 Handle Rate Limit
//     if (errorCode === 429 || errorMessage.includes("RESOURCE_EXHAUSTED")) {
//       return res.status(429).json({
//         message:
//           "AI processing limit reached. Please wait a few minutes and try again.",
//         ok: false,
//         // type: "AI_RATE_LIMIT"
//       });
//     }

//     // 🔥 Handle Gemini failure generally
//     if (errorMessage.includes("generative") || errorMessage.includes("Gemini")) {
//       return res.status(503).json({
//         message:
//           "AI service is temporarily unavailable. Please try again later.",
//         ok: false,
//         // type: "AI_SERVICE_ERROR"
//       });
//     }

//     // 🔥 Default fallback
//     return res.status(500).json({
//       message: error?.message,

//       ok: false,
//     });
//   }
// };



//  SECOND VERSION


export const extractShopMaterialDocDetailsv1 = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, fileId, categoryId, organizationId } = req.params;


    // Modified Step 1 for better multi-tenant security
    const [document, category] = await Promise.all([
      MaterialShopDocumentModel.findOne({ _id: id, organizationId: organizationId }),
      CategoryModel.findOne({ _id: categoryId, organizationId: organizationId })
    ]);

    if (!document || !category) {
      return res.status(404).json({ message: "Document or Category not found", ok: false });
    }

    const targetFile = document.file.find((f: any) => f._id.toString() === fileId);
    if (!targetFile || !targetFile.url) {
      return res.status(404).json({ message: "File not found", ok: false });
    }

    // 2. Identify keys to extract (visibleIn: "material")
    const extractionFields = category.fields.filter(f => f.visibleIn?.includes("material"));
    // const extractionKeys = extractionFields.map(f => f.key);

    // Define default values based on category schema types
    const defaultValues = category.fields.reduce((acc, field) => {
      if (field.type === "number") acc[field.key] = 0;
      else if (field.type === "boolean") acc[field.key] = false;
      else acc[field.key] = null;
      return acc;
    }, {} as Record<string, any>);


    async function splitPdfIntoPages(pdfBuffer: ArrayBuffer): Promise<string[]> {
      const mainPdf = await PDFDocument.load(pdfBuffer);
      const pageCount = mainPdf.getPageCount();
      const base64Pages: string[] = [];

      for (let i = 0; i < pageCount; i++) {
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(mainPdf, [i]);
        newDoc.addPage(copiedPage);

        const pdfBytes = await newDoc.save();
        // Convert to Base64 for Gemini inlineData
        base64Pages.push(Buffer.from(pdfBytes).toString('base64'));
      }
      return base64Pages;
    }


    // 3. Prepare File for AI
    const fileResponse = await axios.get(targetFile.url, { responseType: 'arraybuffer' });
    const base64Data = Buffer.from(fileResponse.data).toString('base64');
    const mimeType = targetFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';

    // 4. Construct Dynamic Prompt
    // 2. Identify keys to extract
    const extractionKeys = extractionFields.map(f => f.key);

    const base64Pages = await splitPdfIntoPages(fileResponse.data);

let aiExtractedItems: any[] = [];

 // 4. Construct the Dynamic Reasoning Prompt
    const promptText = `
        ACT AS AN EXPERT DATA EXTRACTOR FOR INTERIOR DESIGN CATALOGUES.
        
        TARGET CATEGORY: "${category.name}"
        REQUIRED SYSTEM KEYS: [${extractionKeys.join(", ")}]

        INSTRUCTIONS:
        1. Analyze the provided ${targetFile.type} and identify individual product items.
        2. For each item, you must map the information found in the document to the "REQUIRED SYSTEM KEYS" listed above.
        
        SEMANTIC MAPPING RULES:
        - Use logical synonyms. For example, if you find "Price", "MRP", or "Cost", map it to the "Rs" key or if the related keys are mentioned in the REQUIRED SYSTEM KEYS.
        - If you find "Measurement", "Size", or "W x H", map it to "thickness" or related dimension keys if they exist or if the related keys are mentioned in the REQUIRED SYSTEM KEYS.
        - Brand Identification: Identify the Brand of the items. This might be a header on the page or mentioned per item. Assign this to the "Brand" key.
        - STRICT DISCARD: If the document contains information (like "itemName" or "weight") that has no similar or related key in the REQUIRED SYSTEM KEYS, DISCARD that information. Do not create new keys.
        
        OUTPUT RULES:
        - Return ONLY a valid JSON array of objects.
        - EVERY object in the array MUST contain ALL the following keys: ${extractionKeys.join(", ")}.
        - If a specific value cannot be found or mapped for an item, set that key's value to null.
        - Ensure number strings are converted to actual numbers where appropriate (e.g., "Rs": 2000 instead of "Rs": "2000").
        
        EXAMPLE OUTPUT FORMAT:
        [{"${extractionKeys[0]}": "value", "${extractionKeys[1]}": "value", ...}]
    `;

   // Loop through each page Base64 chunk
        for (let i = 0; i < base64Pages.length; i++) {
            const pageData = base64Pages[i];

            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash-lite",
                contents: [{
                    role: 'user',
                    parts: [
                        { text: promptText },
                        { inlineData: { data: pageData, mimeType: "application/pdf" } }
                    ]
                }],
                config: { temperature: 0.1, maxOutputTokens: 8192 }
            });

            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
            const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                // Your exact parsing logic
                const start = cleanText.indexOf("[");
                const end = cleanText.lastIndexOf("]");
                const pageItems = JSON.parse(cleanText.substring(start, end + 1));
                aiExtractedItems = [...aiExtractedItems, ...pageItems];
            } catch (e) {
                console.error(`--- AI Parsing Error on Page ${i + 1} ---`);
            }

            // Rate Limit protection: Wait 2 seconds between chunks
            if (base64Pages.length > 1 && i < base64Pages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

   

    // // 5. Call Gemini
    // const result = await genAI.models.generateContent({
    //   model: "gemini-2.0-flash-lite",
    //   // model: "gemini-1.5-flash",
    //   contents: [{
    //     role: 'user',
    //     parts: [
    //       { text: promptText },
    //       { inlineData: { data: base64Data, mimeType: mimeType } }
    //     ]
    //   }],
    //   config: { temperature: 0.1, maxOutputTokens: 8192 }
    // });

    // const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
    // const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();



    // // 🔹 DEBUG LOGS
    // console.log("--- AI RAW RESPONSE START ---");
    // console.log(responseText);
    // console.log("--- AI RAW RESPONSE END ---");



    // let aiExtractedItems = [];
    // try {
    //   const start = cleanText.indexOf("[");
    //   const end = cleanText.lastIndexOf("]");
    //   aiExtractedItems = JSON.parse(cleanText.substring(start, end + 1));
    // } catch (e) {
    //   return res.status(500).json({ message: "AI Parsing Error", ok: false });
    // }

    // console.log("aiExtractedItems", aiExtractedItems)

    // 6. Map to ItemModel and Append to Database (OLD VERSION)
    // const itemsToSave = aiExtractedItems.map((item: any) => ({
    //   organizationId: organizationId,
    //   categoryId: category._id,
    //   categoryName: category.name,
    //   data: {
    //     ...defaultValues, // Fill all category fields with defaults first
    //     ...item           // Overwrite with AI extracted data
    //   }
    // }));

    // // Bulk insert the new items
    // await ItemModel.insertMany(itemsToSave);

    // 6. 🛡️ STRICT VALIDATION & MAPPING (NEW VERSION)
    // const itemsToSave = aiExtractedItems.map((aiItem: any) => {
    //   const filteredData: Record<string, any> = { ...defaultValues };

    //   // Only allow keys that exist in extractionKeys
    //   extractionKeys.forEach((key) => {
    //     if (aiItem.hasOwnProperty(key)) {
    //       filteredData[key] = aiItem[key];
    //     }
    //   });

    //   return {
    //     organizationId: organizationId,
    //     categoryId: category._id,
    //     categoryName: category.name,
    //     data: filteredData // This now ONLY contains valid category keys
    //   };
    // });




    // 6. 🛡️ STRICT VALIDATION & MAPPING
   
    const itemsToSave = aiExtractedItems.map((aiItem: any) => {
      const validatedData: Record<string, any> = {};

      // Loop through the keys the DATABASE expects
      category.fields.forEach((field) => {
        const key = field.key;
        let value = aiItem[key];

        // 1. If AI missed a key, use the default from your defaultValues
        if (value === undefined) {
          value = defaultValues[key];
        }

        // 2. Data Type Enforcement based on your Category Model
        if (field.type === "number" && value !== null) {
          // Ensure price/thickness strings like "1,000" or "18mm" become numbers
          const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
          validatedData[key] = isNaN(num) ? 0 : num;
        } else {
          validatedData[key] = value;
        }
      });



      return {
        organizationId: organizationId,
        categoryId: category._id,
        categoryName: category.name,
        data: validatedData,
        isExtractedByGemini: true // 👈 Added this flag here
      };
    });

    console.log("items to save", itemsToSave)

    // 7. Bulk insert and capture the created documents
    let createdItems: any[] = [];
    // Bulk insert the validated items
    if (itemsToSave.length > 0) {
      createdItems = await ItemModel.insertMany(itemsToSave);
    }

    // Update the source document file status
    targetFile.isExtracted = true;
    await document.save();

    return res.status(200).json({
      message: `Successfully extracted ${itemsToSave.length} items for ${category.name}`,
      data: {
        document: document,
        items: createdItems
      },
      ok: true
    });

  } catch (error: any) {
    console.error("Extraction Error:", error);
    // return res.status(500).json({ message: error.message, ok: false });

    // ✅ Detect Vertex/Gemini 429
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Something went wrong";


    const errorCode =
      error?.response?.data?.error?.code ||
      error?.response?.status;

    // 🔥 Handle Rate Limit
    if (errorCode === 429 || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({
        message:
          "AI processing limit reached. Please wait a few minutes and try again.",
        ok: false,
        // type: "AI_RATE_LIMIT"
      });
    }

    // 🔥 Handle Gemini failure generally
    if (errorMessage.includes("generative") || errorMessage.includes("Gemini")) {
      return res.status(503).json({
        message:
          "AI Extracting service is temporarily unavailable. Please try again later.",
        ok: false,
        // type: "AI_SERVICE_ERROR"
      });
    }

    // 🔥 Default fallback
    return res.status(500).json({
      message: error?.message,
      ok: false,
    });
  }
};


