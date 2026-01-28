import { Request, Response } from "express";
import { Types } from "mongoose";
import InternalQuoteEntryModel from "../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import { generateNextQuoteNumber } from "../Quote Varaint Controller/QuoteVariant.controller";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";

// Define File type with S3 `location`
interface UploadedFile extends Express.Multer.File {
  location: string;
}

const getNextQuoteNumber = async (organizationId: string): Promise<string> => {
  const allQuotes = await InternalQuoteEntryModel.find({ organizationId }).select('quoteNo -_id');

  const maxQuoteNumber = allQuotes.reduce((max, quote) => {
    const number = Number(quote.quoteNo?.replace('Q-', ''));
    return !isNaN(number) && number > max ? number : max;
  }, 0);

  const nextNumber = maxQuoteNumber + 1;
  return `Q-${nextNumber}`;
};




export const createMainInternalQuoteResidentialVersion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, projectId, mainQuoteName, quoteCategory, quoteType } = req.body;

    // 1. Mandatory Field Validation
    if (!organizationId || !projectId || !mainQuoteName || !quoteType) {
      return res.status(400).json({
        ok: false,
        message: "Missing mandatory fields: organizationId, projectId, mainQuoteName, and quoteType are required."
      });
    }


    const quoteNumber = await getNextQuoteNumber(organizationId)

    // 2. Document Creation
    const newQuote = new InternalQuoteEntryModel({
      organizationId,
      projectId,
      quoteType,
      quoteNo: quoteNumber || null,
      quoteCategory,
      mainQuoteName,
      grandTotal: 0
    });

    await newQuote.save();


    // 2. If it's a Sqft Rate quote, create the Client Variant mirror immediately
    if (quoteType === "sqft_rate") {
      const quoteNo = await generateNextQuoteNumber(organizationId);

      const newVariant = new QuoteVarientGenerateModel({
        quoteId: newQuote._id, // Link to the internal quote
        quoteNo: quoteNo,
        organizationId,
        projectId,
        mainQuoteName,
        quoteType,
        quoteCategory,
        sqftRateWork: [],
        grandTotal: 0,
      });

      console.log("newVariant", newVariant)
      await newVariant.save();
    }


    res.status(201).json({ ok: true, data: newQuote });

  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};



export const updateMainInternalQuoteResidentialVersion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // Get the ID from the URL params
    const { projectId, mainQuoteName, quoteCategory, quoteType } = req.body;

    // 1. Mandatory Field Validation
    if (!id) {
      return res.status(400).json({ ok: false, message: "Quote ID is required for updating." });
    }

    if (!projectId || !mainQuoteName || !quoteCategory) {
      return res.status(400).json({
        ok: false,
        message: "Missing mandatory fields: projectId, mainQuoteName, and quoteCategory are required."
      });
    }

    // 2. Find and Update the Document
    // { new: true } returns the document AFTER the update is applied
    // { runValidators: true } ensures the new data matches your Schema rules
    const updatedQuote = await InternalQuoteEntryModel.findByIdAndUpdate(
      id,
      {
        projectId,
        mainQuoteName,
        quoteCategory
      },
      { new: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({ ok: false, message: "Quote record not found." });
    }


    if (quoteType === "sqft_rate") {
      // 2. Sync with the QuoteVariant Model
      // We find the variant where quoteId matches our current Internal ID
      await QuoteVarientGenerateModel.findOneAndUpdate(
        { quoteId: id },
        {
          $set: {
            projectId,
            mainQuoteName,
            quoteCategory
          }
        },
        { runValidators: true }
      );
    }


    // 3. Response
    res.status(200).json({
      ok: true,
      message: "Quote header updated successfully",
      data: updatedQuote
    });



  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};


//  THE BELOW ONE IS NOT USED, ONLY  EDIT IS USED BUT IT IS GETTING USED IN THE MOBILE APP
export const createMaterialQuote = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, projectId } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid organizationId' });
    }
    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid projectId' });
    }

    // Parse furnitures array from body
    const furnitures = JSON.parse(req.body.furnitures || '[]');
    const grandTotal = Number(req.body.grandTotal || 0);
    const notes = req.body.notes || null;
    const quoteNo = await getNextQuoteNumber(organizationId); // ✅ Unique quote number



    // Optional uploaded files from S3
    const files = req.files as UploadedFile[] | undefined;

    console.log("files from core material", files)

    // Map: { 'images[0][1]': fileObj }
    const fileMap: Record<string, UploadedFile> = {};
    files?.forEach((file) => {
      if (file.fieldname) {
        fileMap[file.fieldname] = file;
      }
    });

    const cleanSimpleItems = (section: any[]): any[] =>
      (section || []).map((item) => ({
        itemName: item.itemName || null,
        description: item.description || null,
        quantity: Number(item.quantity || 0),
        profitOnMaterial: Number(item?.profitOnMaterial || 0),
        cost: Number(item.cost || 0),
        rowTotal: Number(item.rowTotal || 0),
      }));


    // console.log("desingnes", JSON.stringify(furnitures))

    const processedFurniture = furnitures.map((furniture: any, furnitureIndex: number) => {
      const coreMaterials = (furniture.coreMaterials || []).map((material: any, materialIndex: number) => {
        const fieldKey = `images[${furnitureIndex}][${materialIndex}]`;
        const matchedFile = fileMap[fieldKey];

        return {
          itemName: material.itemName || null,
          imageUrl: matchedFile?.location || material.imageUrl || null,

          plywoodNos: material.plywoodNos
            ? {
              quantity: Number(material.plywoodNos.quantity || 0),
              thickness: Number(material.plywoodNos.thickness || 0),
            }
            : null,

          laminateNos: material.laminateNos
            ? {
              quantity: Number(material.laminateNos.quantity || 0),
              thickness: Number(material.laminateNos.thickness || 0),
            }
            : null,


          // ✅ ADD THESE TWO SECTIONS BELOW:
          innerLaminate: material?.innerLaminate
            ? {
              quantity: Number(material?.innerLaminate.quantity || 0),
              thickness: Number(material?.innerLaminate.thickness || 0),
            }
            : null,

          outerLaminate: material?.outerLaminate
            ? {
              quantity: Number(material?.outerLaminate.quantity || 0),
              thickness: Number(material?.outerLaminate.thickness || 0),
            }
            : null,

          carpenters: Number(material.carpenters || 0),
          days: Number(material.days || 0),
          profitOnMaterial: Number(material.profitOnMaterial || 0),
          profitOnLabour: Number(material.profitOnLabour || 0),
          rowTotal: Number(material.rowTotal || 0),
          remarks: material.remarks || null,
        };
      });

      return {
        furnitureName: furniture.furnitureName,

        coreMaterials,
        fittingsAndAccessories: cleanSimpleItems(furniture.fittingsAndAccessories),
        glues: cleanSimpleItems(furniture.glues),
        nonBrandMaterials: cleanSimpleItems(furniture.nonBrandMaterials),

        coreMaterialsTotal: Number(furniture.coreMaterialsTotal || 0),
        fittingsAndAccessoriesTotal: Number(furniture.fittingsAndAccessoriesTotal || 0),
        gluesTotal: Number(furniture.gluesTotal || 0),
        nonBrandMaterialsTotal: Number(furniture.nonBrandMaterialsTotal || 0),
        furnitureTotal: Number(furniture.furnitureTotal || 0),
      };
    });

    const newQuote = await InternalQuoteEntryModel.create({
      organizationId,
      projectId,
      quoteNo: quoteNo || null,
      furnitures: processedFurniture,
      grandTotal,
      notes,
    });

    return res.status(201).json({
      ok: true,
      message: 'Material Quote Created Successfully',
      data: newQuote,
    });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return res.status(500).json({
      ok: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


export const editQuoteMaterial = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, projectId, id } = req.params;

    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid organizationId' });
    }

    // if (!projectId || !Types.ObjectId.isValid(projectId)) {
    //   return res.status(400).json({ ok: false, message: 'Missing or invalid projectId' });
    // }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid quote id' });
    }

    const files = req.files as UploadedFile[] | undefined;

    const fileMap: Record<string, UploadedFile> = {};
    files?.forEach(file => {
      if (file.fieldname) fileMap[file.fieldname] = file;
    });



    // Parse data
    const furnitures = JSON.parse(req.body.furnitures || '[]');
    const commonMaterials = JSON.parse(req.body.commonMaterials || '[]')


    // const furnitures = req?.body?.furnitures;
    const grandTotal = Number(req?.body?.grandTotal || 0);
    const commonProfitOverride = Number(req?.body?.commonProfitOverride || 0);
    const globalTransportation = Number(req?.body?.globalTransportation || 0);
    const globalProfitPercent = Number(req?.body?.globalProfitPercent || 0);
    const notes = req?.body?.notes || null;
    const quoteNo = req?.body?.quoteNo || null;

    const cleanSimpleItems = (section: any[]): any[] =>
      (section || []).map((item) => ({
        itemName: item.itemName || null,
        description: item.description || null,
        quantity: Number(item.quantity || 0),
        profitOnMaterial: Number(item?.profitOnMaterial || 0),
        cost: Number(item.cost || 0),
        rowTotal: Number(item.rowTotal || 0),
      }));

    const processedFurniture = (furnitures || []).map((furniture: any, furnitureIndex: number) => {
      const coreMaterials = (furniture.coreMaterials || []).map((material: any, materialIndex: number) => {

        const fieldKey = `images[${furnitureIndex}][${materialIndex}]`;
        const matchedFile = fileMap[fieldKey];



        return {
          itemName: material.itemName || null,
          // imageU/rl: material.imageUrl || null, // 💡 not changing, only preserving
          imageUrl: matchedFile?.location
            ? matchedFile.location
            : (typeof material.imageUrl === 'string' ? material.imageUrl : null),


          plywoodNos: material.plywoodNos
            ? {
              quantity: Number(material.plywoodNos.quantity || 0),
              thickness: Number(material.plywoodNos.thickness || 0),
            }
            : null,

          laminateNos: material.laminateNos
            ? {
              quantity: Number(material.laminateNos.quantity || 0),
              thickness: Number(material.laminateNos.thickness || 0),
            }
            : null,


          // ✅ ADD THESE TWO SECTIONS BELOW:
          innerLaminate: material?.innerLaminate
            ? {
              quantity: Number(material?.innerLaminate.quantity || 0),
              thickness: Number(material?.innerLaminate.thickness || 0),
            }
            : null,

          outerLaminate: material?.outerLaminate
            ? {
              quantity: Number(material?.outerLaminate.quantity || 0),
              thickness: Number(material?.outerLaminate.thickness || 0),
            }
            : null,

          carpenters: Number(material.carpenters || 0),
          days: Number(material.days || 0),
          profitOnMaterial: Number(material.profitOnMaterial || 0),
          profitOnLabour: Number(material.profitOnLabour || 0),
          rowTotal: Number(material.rowTotal || 0),
          remarks: material.remarks || null,
        };
      });

      return {
        furnitureName: furniture.furnitureName,
        furnitureProfit: Number(furniture.furnitureProfit || 0),
        fabricationCost: Number(furniture.fabricationCost || 0),
        coreMaterials,
        fittingsAndAccessories: cleanSimpleItems(furniture.fittingsAndAccessories),
        glues: cleanSimpleItems(furniture.glues),
        nonBrandMaterials: cleanSimpleItems(furniture.nonBrandMaterials),

        coreMaterialsTotal: Number(furniture.coreMaterialsTotal || 0),
        fittingsAndAccessoriesTotal: Number(furniture.fittingsAndAccessoriesTotal || 0),
        gluesTotal: Number(furniture.gluesTotal || 0),
        nonBrandMaterialsTotal: Number(furniture.nonBrandMaterialsTotal || 0),
        furnitureTotal: Number(furniture.furnitureTotal || 0),
      };
    });



    const processedCommonMaterials = cleanSimpleItems(commonMaterials)


    const updatedQuote = await InternalQuoteEntryModel.findByIdAndUpdate(
      id,
      {
        quoteNo,
        furnitures: processedFurniture,
        commonMaterials: processedCommonMaterials,
        commonProfitOverride: commonProfitOverride,
        grandTotal,
        globalTransportation,
        globalProfitPercent,
        notes,
        organizationId,
        // projectId
      },
      { new: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({ ok: false, message: 'Quote not found' });
    }

    return res.status(200).json({
      ok: true,
      message: 'Material Quote Updated Successfully',
      data: updatedQuote,
    });
  } catch (error: any) {
    console.error('Error editing material quote:', error);
    return res.status(500).json({
      ok: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


//  used to show that in the both internal quote and inthe quote variant as get all contorller
export const getMaterialQuoteEntries = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;
    const { projectId, createdAt, quoteNo } = req.query;
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


    const quotes = await InternalQuoteEntryModel.find(filters)
      .sort({ createdAt: -1 })
      .populate("projectId");

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


export const getSingleInternalQuoteResidentialVersion = async (req: Request, res: Response): Promise<any> => {
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
    ).populate("projectId", "_id projectName")

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





export const deleteMaterialQuoteById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid quote ID format.',
      });
    }

    const deletedQuote = await InternalQuoteEntryModel.findByIdAndDelete(id);

    if (!deletedQuote) {
      return res.status(404).json({
        ok: false,
        message: 'Quote not found.',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Quote deleted successfully.',
      data: deletedQuote,
    });
  } catch (error: any) {
    console.error('Error deleting quote:', error.message);
    return res.status(500).json({
      ok: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};



export const duplicateInternalQuote = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, message: "Quote ID is required to copy." });
    }

    // 1. Find the source quote
    const sourceQuote = await InternalQuoteEntryModel.findById(id).lean();

    if (!sourceQuote) {
      return res.status(404).json({ ok: false, message: "Source quote not found." });
    }

    // 2. Logic for "Copy of" naming
    const currentName = sourceQuote.mainQuoteName || "Quote";
    let rootName = currentName;
    // We search for existing copies to determine the next number (e.g., "Copy of Kitchen (1)")
    // const regex = new RegExp(`^Copy of ${baseName}(?: \\((\\d+)\\))?$`);
    // const regex = new RegExp(`^Copy of ${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: \\((\\d+)\\))?$`);

    // Check if the name starts with "Copy of "
    if (currentName.startsWith("Copy of ")) {
      // Strip "Copy of " and any trailing " (n)" to find the original root
      rootName = currentName.replace(/^Copy of /, "").replace(/ \(\d+\)$/, "");
    }

    // --- 2. SEARCH FOR ALL VERSIONS OF THIS COPY ---
    // Escaping the root name for regex safety
    const escapedRoot = rootName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^Copy of ${escapedRoot}(?: \\((\\d+)\\))?$`);

    const existingCopies = await InternalQuoteEntryModel.find({
      organizationId: sourceQuote.organizationId,
      mainQuoteName: { $regex: regex }
    }).select("mainQuoteName");

    // --- 3. CALCULATE THE NEXT NUMBER ---
    let nextNumber = 0;

    if (existingCopies.length > 0) {
      const numbers = existingCopies.map(c => {
        const match = c?.mainQuoteName?.match(/\((\d+)\)$/);
        // "Copy of Kitchen" counts as index 0, "Copy of Kitchen (1)" as index 1
        return match ? parseInt(match[1]) : 0;
      });

      // We find the max and add 1
      nextNumber = Math.max(...numbers) + 1;
    }


    // --- 4. FORMAT THE NEW NAME ---
    // If it's the very first copy of an original, use "Copy of Root"
    // Otherwise use "Copy of Root (n)"
    let newQuoteName = "";
    if (existingCopies.length === 0) {
      newQuoteName = `Copy of ${rootName}`;
    } else {
      newQuoteName = `Copy of ${rootName} (${nextNumber})`;
    }

    // --- 5. SAVE THE DUPLICATE ---
    const { _id, createdAt, updatedAt, ...quoteData } = sourceQuote;
    const quoteNo = await getNextQuoteNumber((sourceQuote as any).organizationId);



    // const newQuoteName = nextNumber === 0
    //   ? `Copy of ${baseName}`
    //   : `Copy of ${baseName} (${nextNumber})`;

    // // 3. Prepare the new Object
    // // Remove _id and createdAt so Mongoose creates a fresh record
    // const { _id, createdAt, updatedAt, ...quoteData } = sourceQuote;

    // const quoteNo = await getNextQuoteNumber((sourceQuote as any).organizationId)

    const duplicatedQuote = new InternalQuoteEntryModel({
      ...quoteData,
      mainQuoteName: newQuoteName, // Update the name
      quoteNo: quoteNo || null, // Generate a new unique quote number/reference
    });

    // 4. Save to Database
    await duplicatedQuote.save();

    res.status(201).json({
      ok: true,
      message: "Quote duplicated successfully",
      data: duplicatedQuote
    });

  } catch (error: any) {
    res.status(500).json({ ok: false, message: error.message });
  }
};



export const updateSqftRateQuoteContent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      sqftRateWork,
      grandTotal,
      globalProfitPercent,
      notes,
    } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, message: "id is required." });
    }

    // Prepare the update object
    // We only update fields relevant to the Sqft Rate workflow
    const updateData = {
      sqftRateWork, // The full array of rooms, works, and sections
      grandTotal,
      globalProfitPercent,
      notes: notes || "Updated Sqft Rate Quote",
      // Optional: Force quoteType to be sqft_rate if it's not already
      // quoteType: "sqft_rate" 
    };

    const updatedQuote = await InternalQuoteEntryModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("projectId", "projectName")
      .populate("sqftRateWork.workId"); // Populates the library item details

    if (!updatedQuote) {
      return res.status(404).json({ ok: false, message: "Quote not found." });
    }


    // await migrateQuoteVariantsToBasic()

    // 2. Sync with the QuoteVariant Model
    // We find the variant where quoteId matches our current Internal ID
    await QuoteVarientGenerateModel.findOneAndUpdate(
      { quoteId: id },
      {
        $set: {
          sqftRateWork,
          grandTotal,
          globalProfitPercent,
          mainQuoteName: updatedQuote.mainQuoteName,

          notes: notes
        }
      },
      { runValidators: true }
    );

    res.status(200).json({
      ok: true,
      message: "Sqft Rate Quote updated successfully",
      data: updatedQuote
    });

  } catch (error: any) {
    console.error("Error updating Sqft Rate Quote:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
};



/**
 * Utility to migrate old client quote variants.
 * Sets quoteType to 'basic' for all documents where it's missing or null.
 */
export const migrateQuoteVariantsToBasic = async () => {
  try {
    console.log("--- Starting Quote Variant Migration ---");

    // 1. Find all documents where quoteType is not set or is null
    const result = await QuoteVarientGenerateModel.updateMany(
      {
        $or: [
          { quoteType: { $exists: false } },
          { quoteType: null }
        ]
      },
      {
        $set: { quoteType: "basic" }
      }
    );

    console.log(`--- Migration Complete: Updated ${result.modifiedCount} documents ---`);

  } catch (error: any) {
    console.error("Migration Error:", error);

  }
};