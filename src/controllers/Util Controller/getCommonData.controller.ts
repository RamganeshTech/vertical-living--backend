import { Request, Response } from "express";
import { BrandModel } from "../../models/Util Models/util.model"; 

export const getBrandsByCategory = async (req: Request, res: Response):Promise<any> => {
  try {
    const { category } = req.params;
    
    const brands = await BrandModel.findOne({ category });

      if (!brands) {
      return res.status(404).json({ ok: false, message: `No brands found for category: ${category}`, data:[] });
    }

    res.status(200).json({ ok: true, data:brands.brandNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};


