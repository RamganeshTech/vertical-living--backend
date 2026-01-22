import { Request, Response } from "express";
import { MaterialWithLabourRateCategoryModel, MaterialWithLabourRateItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigMaterialWithLabour.model";


/**
 * Get all material categories for an organization
 */
export const getMaterailWithLabourCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const categories = await MaterialWithLabourRateCategoryModel.find({ organizationId }).lean();

    return res.status(200).json({
      ok: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories of labour:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



// Controller to create a new material category
export const createMaterailWithLabourCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, name, fields } = req.body;

    if (!organizationId || !name || !Array.isArray(fields)) {
      return res.status(400).json({
        ok: false,
        message: "organizationId, name, and fields are required",
      });
    }

    // validate fields structure
    for (const field of fields) {
      if (!field.key) {
        return res.status(400).json({
          ok: false,
          message: "Each field must have a key",
        });
      }
      if (field.type && !["string", "number", "boolean"].includes(field.type)) {
        return res.status(400).json({
          ok: false,
          message: `Invalid type '${field.type}' for field '${field.key}'`,
        });
      }
    }

    const newCategory = new MaterialWithLabourRateCategoryModel({
      organizationId,
      name,
      fields,
    });

    await newCategory.save();

    return res.status(201).json({
      ok: true,
      message: "labour category created successfully",
      data: newCategory,
    });
  } catch (error: any) {
    console.error("Error creating material category:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};




export const deleteMaterailWithLabourCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;

    const category = await MaterialWithLabourRateCategoryModel.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    // Delete all items belonging to this category
    await MaterialWithLabourRateItemModel.deleteMany({ categoryId });

    return res.status(200).json({
      ok: true,
      message: "Category and its items deleted successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error deleting Labour category:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};





/**
 * Get all material items under a specific category
 */
export const getMaterailWithLabourItemsByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId , categoryId} = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const items = await MaterialWithLabourRateItemModel.find({ organizationId, categoryId }).lean();

    return res.status(200).json({
      ok: true,
      message: "labours fetched successfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching labrou items:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};





// GET CONTORLELR TO GET ALL THE FIELDS AND  CLACUALTE AS SNIGLE LABOR COST
//  IT IS USED INT HE OLD VERION  (NOT TEMPLATES VERSION)
export const getSingleMaterailWithLabourRateConfigCost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, categoryId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }



    const items = await MaterialWithLabourRateItemModel.find({ organizationId, categoryId}).lean();

    // const salary = Object.entries(item?.data || {}).reduce((acc, [key, value]) => acc + value, 0);
    const salary = items.reduce((acc, item) => acc + Number(item?.data?.Rs || 0), 0);

    return res.status(200).json({
      ok: true,
      message: "labours salary successfully",
      data: salary || 0,
    });
  } catch (error: any) {
    console.error("Error fetching labrou items:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// THIS IS THE NEW VERSION OF CALCULATING THE SINGLE WORK SALARY (NEW VERSION) (TEMPLATE)
export const getMaterailWithLabourSalaryByCategoryName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;
    const { categoryName } = req.query; // e.g., "Glass"

    if (!organizationId || !categoryName) {
      return res.status(400).json({
        ok: false,
        message: "organizationId and categoryName are required",
      });
    }

    // Create a case-insensitive regex that matches the string as a substring
    // This handles "Glass", "glass", and "Glass and fancy work"
    const regex = new RegExp(categoryName as string, "i");

    // 1. Find the LabourRate documents where the category matches our regex
    const items = await MaterialWithLabourRateItemModel.find({ 
      organizationId, 
      categoryName: { $regex: regex } 
    }).lean();

    // 2. Sum the 'Rs' value from the data object of each matched item
    const totalSalary = items.reduce((acc, item) => {
        return acc + (Number(item?.data?.Rs) || 0);
    }, 0);

    return res.status(200).json({
      ok: true,
      data: totalSalary,
      itemCount: items.length
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to create material items
export const createMaterailWithLabourItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const {  organizationId, categoryId} = req.params;
    const items: Record<string, any>[] = req.body.items; // expecting array of objects

    // console.log("items", items)
    // console.log("req.body", req.body)
    if (!organizationId  || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "organizationId, and items array are required",
      });
    }

    // Get category definition
    const category = await MaterialWithLabourRateCategoryModel.findOne({organizationId, _id: categoryId}).lean();
    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    // validate each item against category fields
    const errors: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      for (const fieldDef of category.fields) {
        const value = item[fieldDef.key];

        if (fieldDef.required && (value === undefined || value === null || value === "")) {
          errors.push(`Item ${i + 1}: Field '${fieldDef.key}' is required`);
        }

        if (value !== undefined && value !== null) {
          if (fieldDef.type === "number" && typeof value !== "number") {
            errors.push(`Item ${i + 1}: Field '${fieldDef.key}' must be a number`);
          }
          if (fieldDef.type === "string" && typeof value !== "string") {
            errors.push(`Item ${i + 1}: Field '${fieldDef.key}' must be a string`);
          }
          if (fieldDef.type === "boolean" && typeof value !== "boolean") {
            errors.push(`Item ${i + 1}: Field '${fieldDef.key}' must be a boolean`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors,
      });
    }

    // Prepare documents for bulk insert
    const itemDocs = items.map((data) => ({
      organizationId,
      // organizationId,
      categoryId,
      categoryName:category.name,
      data,
    }));

    const createdItems = await MaterialWithLabourRateItemModel.insertMany(itemDocs);

    return res.status(201).json({
      ok: true,
      message: "labour configs created successfully",
      data: createdItems,
    });
  } catch (error: any) {
    console.error("Error creating material items:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const updateMaterailWithLabourItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;
    const updates: Record<string, any> = req.body; // expect flat object like { brand: "X", rate: 120 }

    // Find the existing item
    const item = await MaterialWithLabourRateItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        ok: false,
        message: "Material item not found",
      });
    }

    // Get category definition for validation
    const category = await MaterialWithLabourRateCategoryModel.findById(item.categoryId).lean();
    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    // Validate updates against category fields
    const errors: string[] = [];
    for (const fieldDef of category.fields) {
      const value = updates[fieldDef.key] ?? item.data[fieldDef.key]; // use updated or existing value

      if (fieldDef.required && (value === undefined || value === null || value === "")) {
        errors.push(`Field '${fieldDef.key}' is required`);
      }

      if (value !== undefined && value !== null) {
        if (fieldDef.type === "number" && typeof value !== "number") {
          errors.push(`Field '${fieldDef.key}' must be a number`);
        }
        if (fieldDef.type === "string" && typeof value !== "string") {
          errors.push(`Field '${fieldDef.key}' must be a string`);
        }
        if (fieldDef.type === "boolean" && typeof value !== "boolean") {
          errors.push(`Field '${fieldDef.key}' must be a boolean`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors,
      });
    }

    // Merge updates into item.data
    item.data = { ...item.data.toObject?.() ?? item.data, ...updates };
    await item.save();

    return res.status(200).json({
      ok: true,
      message: "labours rate updated successfully",
      data: item,
    });
  } catch (error: any) {
    console.error("Error updating labours item:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const deleteMaterailWithLabourItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;

    const deletedItem = await MaterialWithLabourRateItemModel.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({
        ok: false,
        message: "labour item not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "labour item deleted successfully",
      data: deletedItem,
    });
  } catch (error: any) {
    console.error("Error deleting labour item:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


