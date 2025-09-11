import { Request, Response } from "express";
import { Types } from "mongoose";
import MaterialQuoteGenerateModel from "../../../models/Quote Model/QuoteGenerate Model/QuoteGenerate.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";

// Define File type with S3 `location`
interface UploadedFile extends Express.Multer.File {
  location: string;
}

// ----------------------------
// @route   POST /api/material-quote/:organizationId/:projectId
// ----------------------------
export const createMaterialQuote = async (req: Request, res: Response): Promise<any> => {
    try{
  const { organizationId, projectId } = req.params;

  // Validate IDs
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({ ok:false, message: "Missing or invalid organizationId" });
  }
  if (!projectId || !Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ ok:false, message: "Missing or invalid projectId" });
  }

//   const {
//     categorySections = [],
//     fittings = [],
//     glues = [],
//     nonBrandedMaterials = [],
//     plywoodTotal = 0,
//     fittingsTotal = 0,
//     glueTotal = 0,
//     nbmTotal = 0,
//     grandTotal = 0
//   } = req.body;



const categorySections = JSON.parse(req.body.categorySections || "[]");
const fittings = JSON.parse(req.body.fittings || "[]");
const glues = JSON.parse(req.body.glues || "[]");
const nonBrandedMaterials = JSON.parse(req.body.nonBrandedMaterials || "[]");

const plywoodTotal = Number(req.body.plywoodTotal || 0);
const fittingsTotal = Number(req.body.fittingsTotal || 0);
const glueTotal = Number(req.body.glueTotal || 0);
const nbmTotal = Number(req.body.nbmTotal || 0);
const grandTotal = Number(req.body.grandTotal || 0);

  // Optional image uploads for category items
  const files = req.files as UploadedFile[] | undefined;


   const fileMap: Record<number, UploadedFile> = {};
    files?.forEach((file) => {
const match = file.fieldname?.match(/images\[(\d+)\]/);
      if (match) {
        const idx = Number(match[1]);
        fileMap[idx] = file;
      }
    });

  // Map image file to category section by index if available
  const updatedCategorySections = categorySections.map((item: any, index: number) => {
          const matchedFile = fileMap[index];


    return {
      itemName: item.itemName || null,
      imageUrl: matchedFile?.location || item?.imageUrl || null,
      plywoodNos: Number(item.plywoodNos) || 0,
      laminateNos: Number(item.laminateNos) || 0,
      carpenters: Number(item.carpenters) || 0,
      days: Number(item.days) || 0,
      profitOnMaterial: Number(item.profitOnMaterial) || 0,
      profitOnLabour: Number(item.profitOnLabour) || 0,
      rowTotal: Number(item.rowTotal) || 0,
      remarks: item.remarks || null,
      itemMaterialId: item.itemMaterialId || null,
    };
  });

  const cleanSimpleItems = (sectionItems: any[]) =>
    (sectionItems || []).map((item: any) => ({
      itemName: item.itemName || null,
      description: item.description || null,
      quantity: Number(item.quantity) || 0,
      cost: Number(item.cost) || 0,
      rowTotal: Number(item.rowTotal) || 0,
    }));

  const newQuote = await MaterialQuoteGenerateModel.create({
    organizationId,
    projectId,
    categorySections: updatedCategorySections,
    fittings: cleanSimpleItems(fittings),
    glues: cleanSimpleItems(glues),
    nonBrandedMaterials: cleanSimpleItems(nonBrandedMaterials),
    plywoodTotal: Number(plywoodTotal) || 0,
    fittingsTotal: Number(fittingsTotal) || 0,
    glueTotal: Number(glueTotal) || 0,
    nbmTotal: Number(nbmTotal) || 0,
    grandTotal: Number(grandTotal) || 0,
  });

  res.status(201).json({
    ok: true,
    message: "Material Quote Created Successfully",
    data: newQuote,
  });
}
 catch (error: any) {
    console.error("Error creating quote:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}


export const getMaterialCategories = async (req: Request, res: Response):Promise<any> => {
  try {
    const { organizationId } = req.params;

    // Optional: Validate inputs
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Invalid organizationId" });
    }

    
    const category = await CategoryModel.find({
      organizationId
    });

    return res.status(200).json({
      ok: true,
      message: "categoes fetched",
      data: category,
    });

  } catch (error: any) {
    console.error("Error fetching category", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};


export const getMaterialItemsByCategoryForQuote = async (req: Request, res: Response):Promise<any> => {
  try {
    const { organizationId, categoryId } = req.params;

    // Optional: Validate inputs
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Invalid organizationId" });
    }

    if (!categoryId) {
      return res.status(400).json({ ok: false, message: "Category (e.g., plywood) is required" });
    }

    const items = await ItemModel.find({
      organizationId,
      categoryId: categoryId
    });

    return res.status(200).json({
      ok: true,
      message: "Material items fetched",
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
