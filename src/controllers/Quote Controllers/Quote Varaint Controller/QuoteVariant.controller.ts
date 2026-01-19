import { Request, Response } from "express";
import InternalQuoteEntryModel from "../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
// import { generatePdfMaterialPacakgeComparison } from "../../stage controllers/material Room confirmation/materialRoomConfirmation.controller";
import { generateQuoteVariantPdf } from "./pdfQuoteVarientGenerate";

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
      brandName,
      organizationId,
      projectId,
      furnitures,
      grandTotal,
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


    const quoteNo = await generateNextQuoteNumber(organizationId);


    // 🟢 Create DB entry (pdfLink: null for now, will update after PDF gen)
    const newVariant = await QuoteVarientGenerateModel.create({
      quoteNo,
      quoteId,
      brandName,
      organizationId,
      projectId,
      furnitures,
      grandTotal,
      notes,
      pdfLink: null,
    });
    // console.log("new varient", newVariant)
    const pdfResponse = await generateQuoteVariantPdf({ quoteId, projectId, newVariant });
    // const pdfResponse = await generateQuoteVariantPdfWithTemplate({ quoteId, projectId, newVariant , templateType});

    // newVariant.pdfLink
    // await newVariant.save()

    return res.status(201).json({
      ok: true,
      message: "Variant quote created and PDF generated successfully",
      data: {
        quote: newVariant,
        fileName: pdfResponse.fileName,
        url: pdfResponse.fileUrl, // ✅ PDF S3 URL
        data: pdfResponse.updatedDoc, // ✅ Updated DB doc with PDF link
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



