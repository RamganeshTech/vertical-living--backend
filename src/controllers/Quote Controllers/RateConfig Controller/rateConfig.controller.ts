import { Request, Response } from "express";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import mongoose from "mongoose";




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


// Controller: only used for the internal quote for selectig the brands thats it
export const getMaterialItemsForFittings = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryName, itemName } = req.query; // 🆕 Get itemName from query string
    const { organizationId } = req.params


    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "organizationId is required" });

    }
    if (!categoryName) {
      return res.status(400).json({ ok: false, message: "categoryName is required" });
    }




    // ✅ FIX: Use a regex to match the categoryName regardless of surrounding spaces
    // ^ = start, \s* = optional whitespace, $ = end
    const escapedCategory = String(categoryName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const categoryRegex = new RegExp(`^\\s*${escapedCategory}\\s*$`, "i");

    // Build query object
    // let query: any = { categoryName: categoryName.trim() };

    // let query: any = {
    //   categoryName: categoryRegex,
    //   organizationId,
    // };

    // // 🆕 If itemName is provided, filter the nested 'data.Item' field
    // if (itemName) {
    //   query["data.Item"] = { $regex: itemName, $options: "i" };
    // }



    //   NEW VERSION


    let query: any = {
      categoryName: categoryRegex,
      organizationId,
    };

    // ✅ TRUE includes-based dynamic matching
    if (itemName) {
      const words = String(itemName)
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      if (words.length > 0) {
        query["data.Item"] = {
          $regex: words.join("|"), // OR match any word
          $options: "i",
        };
      }
    }


    const items = await ItemModel.find(query).lean();

    return res.status(200).json({
      ok: true,
      message: "Items fetched successfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ ok: false, message: "Internal server error" });
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

      // Validate visibleIn (Optional: Ensure it's an array of strings)
      if (field.visibleIn && !Array.isArray(field.visibleIn)) {
         return res.status(400).json({ ok: false, message: `visibleIn for '${field.key}' must be an array` });
      }
    }

    const newCategory = new CategoryModel({
      organizationId,
      name,
      fields,
    });

    await newCategory.save();

    return res.status(201).json({
      ok: true,
      message: "Material category created successfully",
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


export const updateMaterialCategoryAndSyncItems = async (req: Request, res: Response): Promise<any> => {
    try {
        const { categoryId, organizationId } = req.params;
        const { name, fields } = req.body;

        // 1. Fetch the existing category
        const existingCategory = await CategoryModel.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ ok: false, message: "Category not found" });
        }

        // Use 'key' to match your Schema interface MaterialCategoryDoc
        const oldFieldKeys = existingCategory.fields.map(f => f.key);
        const newFieldKeys = fields.map((f: any) => f.key);

        // 2. Identify changes
        const fieldsToAdd = newFieldKeys.filter((k:any) => !oldFieldKeys.includes(k));
        const fieldsToRemove = oldFieldKeys.filter(k => !newFieldKeys.includes(k));

        // 3. Update Category Model
        // existingCategory.name = name || existingCategory.name;
        existingCategory.fields = fields; 
        await existingCategory.save();

        // 4. SYNC WITH ITEM MODEL
        // Filter must match your ItemModel field: 'categoryId'
        const itemFilter = { 
            categoryId: categoryId, 
            organizationId: organizationId 
        };

        // A. Handle Removals: Use dot notation "data.key" to reach inside the Mixed object
        if (fieldsToRemove.length > 0) {
            const unsetObj: any = {};
            fieldsToRemove.forEach(key => {
                unsetObj[`data.${key}`] = ""; 
            });

            await ItemModel.updateMany(itemFilter, { $unset: unsetObj });
        }

        // B. Handle Additions: Set default values inside the "data" object
        if (fieldsToAdd.length > 0) {
            const setObj: any = {};
            fieldsToAdd.forEach((key:any) => {
                const fieldConfig = fields.find((f: any) => f.key === key);
                
                // Determine a safe default based on type
                let defaultValue: any = "";
                if (fieldConfig?.type === "number") defaultValue = 0;
                if (fieldConfig?.type === "boolean") defaultValue = false;

                setObj[`data.${key}`] = defaultValue;
            });

            await ItemModel.updateMany(itemFilter, { $set: setObj });
        }

        return res.status(200).json({
            ok: true,
            message: "Category updated and all items synced successfully",
            syncDetails: { added: fieldsToAdd, removed: fieldsToRemove },
            data: existingCategory
        });

    } catch (error: any) {
        console.error("Sync Update Error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};


// Controller to create material items
export const createMaterialItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId, organizationId } = req.params; // categoryId passed in URL
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
      categoryName: category.name,
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

