import { Request, Response } from "express";
import { Types } from "mongoose";
import InternalQuoteEntryModel from "../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";

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


    console.log("desingnes", JSON.stringify(furnitures))

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

    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid projectId' });
    }

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

    // const furnitures = req?.body?.furnitures;
    const grandTotal = Number(req?.body?.grandTotal || 0);
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
      const coreMaterials = (furniture.coreMaterials || []).map((material: any,  materialIndex: number) => {

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

    const updatedQuote = await InternalQuoteEntryModel.findByIdAndUpdate(
      id,
      {
        quoteNo,
        furnitures: processedFurniture,
        grandTotal,
        notes,
        organizationId,
        projectId
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


    const quotes = await InternalQuoteEntryModel.find(filters).populate("projectId");

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




