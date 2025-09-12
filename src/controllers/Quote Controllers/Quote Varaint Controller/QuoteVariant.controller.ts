import { Request, Response } from "express";
import MaterialQuoteGenerateModel from "../../../models/Quote Model/QuoteGenerate Model/QuoteGenerate.model";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";

export const getMaterialQuoteSingle = async (req: Request, res: Response):Promise<any> => {
  try {
    const { organizationId , id} = req.params;

    // Optional: Validate inputs
    if (!organizationId || !id) {
      return res.status(400).json({ ok: false, message: "Invalid Ids" });
    }



    
    const quote = await MaterialQuoteGenerateModel.findOne({
      organizationId, _id: id
    });

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



export const getMaterialItemsByCategoryForQuote = async (req: Request, res: Response):Promise<any> => {
  try {
    const { organizationId, categoryName } = req.params;

    // Optional: Validate inputs
    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Invalid organizationId" });
    }

    if (!categoryName) {
      return res.status(400).json({ ok: false, message: "Category (e.g., plywood) is required" });
    }
    console.log("im gettni called")
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
console.log("item", items)

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




















 

// export const getMaterialCategories = async (req: Request, res: Response):Promise<any> => {
//   try {
//     const { organizationId } = req.params;

//     // Optional: Validate inputs
//     if (!organizationId) {
//       return res.status(400).json({ ok: false, message: "Invalid organizationId" });
//     }

    
//     const category = await CategoryModel.find({
//       organizationId
//     });

//     return res.status(200).json({
//       ok: true,
//       message: "categoes fetched",
//       data: category,
//     });

//   } catch (error: any) {
//     console.error("Error fetching category", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Failed to fetch category",
//       error: error.message,
//     });
//   }
// };
