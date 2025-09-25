import { Request, Response } from "express";
import { LabourRateModel , LabourRateCategoryModel} from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigLabour.model";


/**
 * Get all material categories for an organization
 */
export const getLabourCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const categories = await LabourRateCategoryModel.find({ organizationId }).lean();

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

/**
 * Get all material items under a specific category
 */
export const getLabourItemsByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const items = await LabourRateModel.find({ organizationId }).lean();

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

export const getSingleLabourRateConfigCost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const items = await LabourRateModel.find({ organizationId}).lean();

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







// Controller to create a new material category
export const createLabourCategory = async (req: Request, res: Response): Promise<any> => {
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

    const newCategory = new LabourRateCategoryModel({
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


// Controller to create material items
export const createLabourItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const {  organizationId} = req.params;
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
    const category = await LabourRateCategoryModel.findOne({organizationId}).lean();
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
      categoryName:category.name,
      data,
    }));

    const createdItems = await LabourRateModel.insertMany(itemDocs);

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


export const updateLabourItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;
    const updates: Record<string, any> = req.body; // expect flat object like { brand: "X", rate: 120 }

    // Find the existing item
    const item = await LabourRateModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        ok: false,
        message: "Material item not found",
      });
    }

    // Get category definition for validation
    const category = await LabourRateCategoryModel.findById(item.categoryId).lean();
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



export const deleteLabourItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;

    const deletedItem = await LabourRateModel.findByIdAndDelete(itemId);

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



export const deleteLabourCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;

    const category = await LabourRateCategoryModel.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    // Delete all items belonging to this category
    await LabourRateModel.deleteMany({ categoryId });

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

