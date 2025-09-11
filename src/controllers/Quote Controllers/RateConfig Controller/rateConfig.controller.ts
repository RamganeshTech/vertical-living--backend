import { Request, Response } from "express";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";




/**
 * Get all material categories for an organization
 */
export const getMaterialCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const categories = await CategoryModel.find({ organizationId }).lean();

    return res.status(200).json({
      ok: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
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
export const getMaterialItemsByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        ok: false,
        message: "categoryId is required",
      });
    }

    const items = await ItemModel.find({ categoryId }).lean();

    return res.status(200).json({
      ok: true,
      message: "Items fetched successfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// GET CONTORLELR TO GET THE SELECTED CATGOY MATIERIAL ITEMS






// Controller to create a new material category
export const createMaterialCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, name, fields } = req.body;

    if (!organizationId || !name || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: "organizationId, name, and fields are required",
      });
    }

    // validate fields structure
    for (const field of fields) {
      if (!field.key) {
        return res.status(400).json({
          success: false,
          message: "Each field must have a key",
        });
      }
      if (field.type && !["string", "number", "boolean"].includes(field.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type '${field.type}' for field '${field.key}'`,
        });
      }
    }

    const newCategory = new CategoryModel({
      organizationId,
      name,
      fields,
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: "Material category created successfully",
      data: newCategory,
    });
  } catch (error: any) {
    console.error("Error creating material category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Controller to create material items
export const createMaterialItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId , organizationId} = req.params; // categoryId passed in URL
    const items: Record<string, any>[] = req.body.items; // expecting array of objects

    // console.log("items", items)
    // console.log("req.body", req.body)
    if (!organizationId || !categoryId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "organizationId, categoryId, and items array are required",
      });
    }

    // Get category definition
    const category = await CategoryModel.findById(categoryId).lean();
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
      categoryId,
      data,
    }));

    const createdItems = await ItemModel.insertMany(itemDocs);

    return res.status(201).json({
      ok: true,
      message: "Material items created successfully",
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


export const updateMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;
    const updates: Record<string, any> = req.body; // expect flat object like { brand: "X", rate: 120 }

    // Find the existing item
    const item = await ItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        ok: false,
        message: "Material item not found",
      });
    }

    // Get category definition for validation
    const category = await CategoryModel.findById(item.categoryId).lean();
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
      message: "Material item updated successfully",
      data: item,
    });
  } catch (error: any) {
    console.error("Error updating material item:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const deleteMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;

    const deletedItem = await ItemModel.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({
        ok: false,
        message: "Material item not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Material item deleted successfully",
      data: deletedItem,
    });
  } catch (error: any) {
    console.error("Error deleting material item:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const deleteMaterialCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;

    const category = await CategoryModel.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    // Delete all items belonging to this category
    await ItemModel.deleteMany({ categoryId });

    return res.status(200).json({
      ok: true,
      message: "Category and its items deleted successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error deleting material category:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

