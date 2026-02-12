import { Request, Response } from 'express';
import { MaterialShopDocumentModel } from '../../models/ShopMaterial_document_model/shopMaterialDocument.model';
// import { MaterialShopDocumentModel } from '../models/MaterialShopDocument'; // Adjust path
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
dotenv.config()


const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });


export const createMaterialShopDocuments = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryName, organizationId } = req.body;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No PDF/Image files provided.", ok: false });
    }

    if (!organizationId) return res.status(400).json({ message: "Organization ID is required.", ok: false });

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required.", ok: false });
    }


    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
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


export const editMaterialShopCategoryName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: "Category name cannot be empty.", ok: false });
    }

    const trimmedName = categoryName.trim();

    // 1. Check if the new name is already taken by ANOTHER document
    const duplicateCheck = await MaterialShopDocumentModel.findOne({
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
    return res.status(500).json({ message: "Error deleting document", ok: false });
  }
};




//  EXTRACTION

export const extractShopMaterialDocDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, fileId } = req.params;

    // // 1. Find the document
    // const document = await MaterialShopDocumentModel.findById(id);
    // if (!document || !document.file.url) {
    //   return res.status(404).json({ message: "Document not found or no file attached", ok: false });
    // }



    // // 3. Construct the prompt
    // // We provide the URL and tell Gemini to act as a data extractor
    // const prompt = `
    //   You are an expert at reading shop receipts and electrical material bills.
    //   Analyze the document at this URL: ${document.file.url}
    //   Extract a list of electrical items. 
    //   For each item, identify the Brand name and the Item Name.
    //   Return the data strictly as a JSON array of objects with the keys "brand" and "itemName".
    //   Example format: [{"brand": "Havells", "itemName": "1.5sqmm Wire"}, {"brand": "Legrand", "itemName": "16A Switch"}]
    //   If no brand is found, use "Generic". 
    //   Only return the JSON array, no other text.
    // `;


    // // 2. Prepare the Gemini Model
    // const result = await genAI.models.generateContent({
    //   model: "gemini-2.0-flash-lite",
    //   contents: [{ role: 'user', parts: [{ text: prompt }] }],
    //   config: {
    //     temperature: 0.7, // Slightly higher for better elaboration on brands
    //     maxOutputTokens: 400
    //   },
    // });

    // const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // // 5. Parse the JSON from Gemini
    // let extractedData = [];
    // try {
    //   // Use regex to find the JSON array in case Gemini adds markdown code blocks
    //   const jsonMatch = responseText.match(/\[.*\]/s);
    //   extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    // } catch (parseError) {
    //   console.error("JSON Parsing Error from Gemini:", parseError);
    //   return res.status(500).json({ message: "Failed to parse data from AI", ok: false });
    // }

    // // 6. Update the Database
    // document.extractDetails = extractedData;
    // await document.save();



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