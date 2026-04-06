import { Request, Response } from "express";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import mongoose from "mongoose";
import { createItemVersionSnapshot } from "./rateConfigVersion.controller";
import { RoleBasedRequest } from "../../../types/types";
import { getModelNameByRole } from "../../../utils/common features/utils";
import { RateConfigBackupModel } from "../../../models/Quote Model/RateConfigBackup_model/rateConfigBackup.model";




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


// Controller: Search all items in an organization by name, regardless of category used in teh non branded materials 
export const getMaterialItemsForallCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemName } = req.query;
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "organizationId is required" });
    }

    // 1. Prepare the Dynamic Regex
    let searchQuery: any = { organizationId };

    if (itemName) {
      const words = String(itemName)
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      if (words.length > 0) {
        const regexPattern = { $regex: words.join("|"), $options: "i" };

        // 2. Handle multiple possible field names using $or
        // This covers itemName, item, Item, and productName inside the 'data' object
        searchQuery.$or = [
          { "data.itemName": regexPattern },
          { "data.item": regexPattern },
          { "data.item name": regexPattern },
          { "data.Item Name": regexPattern },
          { "data.ItemName": regexPattern },
          { "data.Item name": regexPattern },
          { "data.Itemname": regexPattern },
          { "data.Item": regexPattern },
          { "data.productName": regexPattern }
        ];
      }
    }

    // 3. Execute Query
    // We lean() for performance, and since categoryName is a top-level field 
    // in your schema, it will naturally be included.
    const items = await ItemModel.find(searchQuery).lean();

    return res.status(200).json({
      ok: true,
      count: items.length,
      message: "Items retrieved successfully",
      data: items.map(item => ({
        ...item,
        // We ensure the category context is clear for the frontend
        sourceCategory: item.categoryName || "Uncategorized"
      })),
    });

  } catch (error: any) {
    console.error("Error searching organization items:", error);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};



// GET CONTORLELR TO GET THE SELECTED CATGOY MATIERIAL ITEMS



// Controller to create a new material category
export const createMaterialCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, name, fields, isProductSpecific } = req.body;

    if (!organizationId || !name || !Array.isArray(fields)) {
      return res.status(400).json({
        ok: false,
        message: "organizationId, name, and fields are required",
      });
    }

    const trimmedName = name?.trim();


    // 🔴 Check duplicate category name (case insensitive)
    const existingCategory = await CategoryModel.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") }
    });

    if (existingCategory) {
      return res.status(400).json({
        ok: false,
        message: "Category with this name already exists",
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
      if (field.type && !["string", "number", "boolean", "file"].includes(field.type)) {
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

    if (isProductSpecific !== undefined && typeof isProductSpecific !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "isProductSpecific must be a boolean (true or false)"
      });
    }

    const newCategory = new CategoryModel({
      organizationId,
      name,
      fields,
      isProductSpecific: isProductSpecific || false
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

//  not used currently in web , but used in mobile
export const updateMaterialCategoryAndSyncItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId, organizationId } = req.params;
    const { name, fields, isProductSpecific } = req.body;

    // 1. Fetch the existing category
    const existingCategory = await CategoryModel.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ ok: false, message: "Category not found" });
    }

    // Use 'key' to match your Schema interface MaterialCategoryDoc
    const oldFieldKeys = existingCategory.fields.map(f => f.key);
    const newFieldKeys = fields.map((f: any) => f.key);

    // 2. Identify changes
    const fieldsToAdd = newFieldKeys.filter((k: any) => !oldFieldKeys.includes(k));
    const fieldsToRemove = oldFieldKeys.filter(k => !newFieldKeys.includes(k));

    // 3. Update Category Model
    // existingCategory.name = name || existingCategory.name;
    existingCategory.fields = fields;

    if (isProductSpecific !== undefined) existingCategory.isProductSpecific = isProductSpecific
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
      fieldsToAdd.forEach((key: any) => {
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


export const updateMaterialCategoryAndSyncItemsV2 = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId, organizationId } = req.params;
    const { name, fields, isProductSpecific } = req.body;


    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ ok: false, message: "fields is required and must be an array" });
    }

    const existingCategory = await CategoryModel.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ ok: false, message: "Category not found" });
    }

    const oldFieldKeys = existingCategory.fields.map(f => f.key);

    // --- Pass 1: Identify renames ---
    const renames: { oldKey: string; newKey: string }[] = [];
    fields.forEach((field: any) => {
      if (
        field.oldKey &&
        field.oldKey !== field.key &&
        oldFieldKeys.includes(field.oldKey)
      ) {
        renames.push({ oldKey: field.oldKey, newKey: field.key });
      }
    });

    const renamedNewKeys = renames.map(r => r.newKey);
    const renamedOldKeys = renames.map(r => r.oldKey);

    // --- Pass 2: Identify true additions (excluding rename targets) ---
    const fieldsToAdd: string[] = [];
    fields.forEach((field: any) => {
      const isNewKey = !oldFieldKeys.includes(field.key);
      const isRenameTarget = renamedNewKeys.includes(field.key);

      // FIX: Only add if it's actually new and NOT a renamed field
      if (isNewKey && !isRenameTarget) {
        fieldsToAdd.push(field.key);
      }
    });

    // --- Pass 3: Identify true removals (excluding keys that were renamed away) ---
    const incomingKeys = fields.map((f: any) => f.key);
    const fieldsToRemove = oldFieldKeys.filter(
      key => !incomingKeys.includes(key) && !renamedOldKeys.includes(key)
    );

    // --- Update Category Meta ---
    existingCategory.name = name || existingCategory.name;
    existingCategory.fields = fields.map((f: any) => ({
      key: f.key,
      type: f.type,
      required: f.required ?? false,
      visibleIn: f.visibleIn ?? [],
    }));

    if (isProductSpecific !== undefined) {
      existingCategory.isProductSpecific = isProductSpecific;
    }
    await existingCategory.save();

    // --- Sync Item Documents ---
    const itemFilter = { categoryId, organizationId };

    // A. Renames First: This preserves data by moving it to the new key
    if (renames.length > 0) {
      const renameObj: Record<string, string> = {};
      renames.forEach(r => {
        renameObj[`data.${r.oldKey}`] = `data.${r.newKey}`;
      });
      await ItemModel.updateMany(itemFilter, { $rename: renameObj });
    }

    // B. Removals: Clean up old keys no longer used
    if (fieldsToRemove.length > 0) {
      const unsetObj: Record<string, string> = {};
      fieldsToRemove.forEach(key => {
        unsetObj[`data.${key}`] = "";
      });
      await ItemModel.updateMany(itemFilter, { $unset: unsetObj });
    }

    // C. Additions: Only initialize brand-new fields
    if (fieldsToAdd.length > 0) {
      const setObj: Record<string, any> = {};
      fieldsToAdd.forEach((key: string) => {
        const fieldConfig = fields.find((f: any) => f.key === key);
        let defaultValue: any = "";
        if (fieldConfig?.type === "number") defaultValue = 0;
        if (fieldConfig?.type === "boolean") defaultValue = false;
        setObj[`data.${key}`] = defaultValue;
      });
      await ItemModel.updateMany(itemFilter, { $set: setObj });
    }

    return res.status(200).json({
      ok: true,
      message: "Sync complete",
      syncDetails: { renamed: renames, added: fieldsToAdd, removed: fieldsToRemove },
      data: existingCategory,
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
    // const items: Record<string, any>[] = req.body.items; // expecting array of objects

    const files = req.files as (Express.Multer.File & { location: string })[];

    // const items = JSON.parse(req.body.items);

    const items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    const materialType = req.body?.materialType || null

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

    //  OLD VERSION
    // Prepare documents for bulk insert
    // const itemDocs = items.map((data) => ({
    //   organizationId,
    //   categoryId,
    //   categoryName: category.name,
    //   data,
    // }));


    // Find which field is of type 'file'
    const imageField = category.fields.find((f: any) => f.type === 'file');
    const imageFieldKey = imageField?.key;

    // 3. Map files to items
    const finalItems = items.map((itemData: any, index: number) => {
      // Look for a file named "file-0", "file-1", etc. based on row index
      const rowFile = files?.find(f => f.fieldname === `file-${index}`);

      if (rowFile && imageFieldKey) {
        itemData[imageFieldKey] = rowFile.location; // Store S3 URL
      }

      return {
        organizationId,
        categoryId,
        categoryName: category.name,
        data: itemData,
        materialType
      };
    });

    const createdItems = await ItemModel.insertMany(finalItems);

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




const DIMENSION_CATEGORIES = [
  "wardrobe",
  "kitchen wall units",
  "kitchen base units",
  "kitchen tall units",
  "loft",
  "tv unit",
  "shoe rack",
  "pooja unit",
  "vanity storage",
  "study cabin",
  "dressing unit",
  "crockery unit",
];

/**
 * Parses a dimension key like "7h x 7w" or "8h x 10w" → returns sqft (height × width)
 * Returns null if the key doesn't match the dimension pattern.
 */
// export function parseDimensionSqft(key: string): number | null {
//   // Matches patterns like:   , "8h x 10w", "7h x 12w"
//   const match = key.trim().match(/^(\d+(?:\.\d+)?)h\s*x\s*(\d+(?:\.\d+)?)w$/i);
//   if (!match) return null;
//   const height = parseFloat(match[1]);
//   const width = parseFloat(match[2]);
//   return height * width;
// }

// export function parseDimensionSqft(key: string): number | null {
//   // Handles all these patterns:
//   // "7 x 6", "7h x 6w", "7hx 6w", "7h x6w", "7h x 6ft w"
//   // Rule: first number = height, number after 'x' = width


//   // **Test all your cases:**
//   // ```
//   // "7 x 6"     → 7 × 6 = 42  ✅
//   // "7h x 7w"   → 7 × 7 = 49  ✅
//   // "7hx 6w"    → 7 × 6 = 42  ✅
//   // "7h x6w"    → 7 × 6 = 42  ✅
//   // "7h x 6ft w"→ 7 × 6 = 42  ✅
//   // "8h x 10w"  → 8 × 10 = 80 ✅

//   const match = key
//     .trim()
//     .match(/^(\d+(?:\.\d+)?)\s*(?:h|ft)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:ft\s*)?(?:w)?$/i);

//   if (!match) return null;
//   const height = parseFloat(match[1]);
//   const width = parseFloat(match[2]);
//   return height * width;
// }


export function parseDimensionSqft(key: string): number | null {
  // We removed the anchors ^ and $ and the strict 'h/w' requirements.
  // This version simply finds: [Number] -> [Anything but a number] -> [x] -> [Anything but a number] -> [Number]
  const match = key.trim().match(/(\d+(?:\.\d+)?)[^\d]*x[^\d]*(\d+(?:\.\d+)?)/i);

  if (!match) return null;

  const height = parseFloat(match[1]);
  const width = parseFloat(match[2]);

  return height * width;
}

/**
 * After a Plywood item's Rs is updated, find all matching dimension items
 * (same brand case-insensitive + same thickness) across the dimension categories,
 * and update every dimension key using:
 *
 *   new_value = old_value + (new_Rs - old_Rs) × sqft_of_dimension
 *
 * @param organizationId  - org scope
 * @param brand           - e.g. "Sharon Gold MR"
 * @param thickness       - e.g. 16
 * @param oldRs           - previous Rs value
 * @param newRs           - updated Rs value
 * @returns summary of updated items
 */
export async function propagatePlywoodRsChange(
  organizationId: string | mongoose.Types.ObjectId,
  brand: string,
  thickness: number,
  oldRs: number,
  newRs: number
): Promise<{ updatedCount: number; itemIds: string[] }> {
  const rsDiff = newRs - oldRs;

  // No change — nothing to do
  if (rsDiff === 0) return { updatedCount: 0, itemIds: [] };

  // Find all dimension items for this org whose categoryName is one of the target categories
  // and whose Brand (case-insensitive) + thickness match
  const candidateItems = await ItemModel.find({
    organizationId,
    materialType: "plywood", // dimension items are tagged with materialType: "plywood"
    categoryName: {
      $in: DIMENSION_CATEGORIES.map(
        (c) => new RegExp(`^${c}$`, "i") // case-insensitive match on categoryName
      ),
    },
  });

  const updatedItemIds: string[] = [];
  const failedItemIds: string[] = []; // Track failures

  for (const item of candidateItems) {
    const itemBrand: string = item.data?.Brand ?? item.data?.brand ?? "";
    // const itemThickness: number = item.data?.thickness;
    const itemThickness: number = item.data?.["thickness (mm)"] ?? item.data?.thickness;

    // Case-insensitive brand match + exact thickness match
    const brandMatches =
      itemBrand.trim().toLowerCase() === brand.trim().toLowerCase();
    const thicknessMatches = itemThickness === thickness;
    // const thicknessMatches = Number(itemThickness) === Number(thickness);

    if (!brandMatches || !thicknessMatches) continue;

    // Now update every dimension key in this item's data
    const updatedData = { ...(item.data?.toObject?.() ?? item.data) };
    let hasChanges = false;

    for (const [key, value] of Object.entries(updatedData)) {
      const sqft = parseDimensionSqft(key);
      if (sqft === null) continue; // not a dimension key — skip

      if (typeof value !== "number") continue; // safety check

      const newValue = parseFloat((value + rsDiff * sqft).toFixed(2));
      updatedData[key] = newValue;
      hasChanges = true;
    }

    if (hasChanges) {
      // await createItemVersionSnapshot(item);

      // item.data = updatedData;
      // item.markModified("data");
      // await item.save();
      // updatedItemIds.push(String(item._id));

      try {
        await createItemVersionSnapshot(item);

        item.data = updatedData;
        item.markModified("data");
        await item.save();

        updatedItemIds.push(String(item._id));
      } catch (err: any) {
        console.error(`Failed to update dimension item ${item._id}:`, err.message);
        failedItemIds.push(String(item._id));
        // The loop will now safely continue to the next item
      }
    }
  }

  return { updatedCount: updatedItemIds.length, itemIds: updatedItemIds };
}


export const updateMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;
    const updates: Record<string, any> = req.body; // expect flat object like { brand: "X", rate: 120 }

    // const items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;


    // 2. Extract uploaded files (Multer-S3 provides this)
    const files = req.files as (Express.Multer.File & { location: string })[];

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
      let value = updates[fieldDef.key] ?? item.data[fieldDef.key]; // use updated or existing value

      if (fieldDef.type === "number" && typeof value === "string" && value !== "") {
        value = Number(value);
        updates[fieldDef.key] = value; // Update the object so the parsed number is saved
      }

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



    // 3. Map uploaded file to the correct field key
    if (files && files.length > 0) {
      // Find which field in this category is the 'file' (image) type
      const imageField = category.fields.find((f: any) => f.type === 'file');
      if (imageField) {
        // Use the first uploaded file's S3 location
        updates[imageField.key] = files[0].location;
      }
    }


    //  NEW VERSION

    // ─────────────────────────────────────────────────────────────────
    // 5. PLYWOOD PROPAGATION
    //    If this item is a Plywood category item AND Rs is being updated,
    //    propagate the Rs delta to all matching dimension category items.
    // ─────────────────────────────────────────────────────────────────
    let propagationResult = null;

    const isPlywoodItem =
      item.categoryName?.trim().toLowerCase() === "plywood";
    // Check for Rs or rs in updates vs existing data
    const incomingRs = updates["Rs"] ?? updates["rs"];
    const existingRs = item.data["Rs"] ?? item.data["rs"];
    const rsIsUpdated = incomingRs !== undefined && Number(incomingRs) !== Number(existingRs);
    // const rsIsUpdated =
    //   updates["Rs"] !== undefined && updates["Rs"] !== item.data["Rs"];

    if (isPlywoodItem && rsIsUpdated) {
      // const oldRs: number = Number(item.data["Rs"] ?? item.data["rs"] ?? 0);
      // const newRs: number = Number(updates["Rs"] ?? updates["rs"]);
      const oldRs = Number(existingRs ?? 0);
      const newRs = Number(incomingRs);

      // Brand and thickness come from the existing item data
      // (they may or may not also be in updates — we use the resolved value)
      const brand: string =
        String(updates["Brand"] ?? updates["brand"] ?? item.data["Brand"] ?? item.data["brand"] ?? "");
      // const thickness: number = Number(
      //   updates["thickness"] ?? item.data["thickness"] ?? item.data["thickness (mm)"] ?? 0
      // );

      const thickness: number = Number(
        updates["thickness (mm)"] ??
        item.data["thickness (mm)"] ??
        updates["thickness"] ??
        item.data["thickness"] ??
        0
      );



      if (brand && thickness && oldRs !== newRs) {
        propagationResult = await propagatePlywoodRsChange(
          item.organizationId,
          brand,
          thickness,
          oldRs,
          newRs
        );
      }
      else {
        console.log(`Propagation skipped: Brand="${brand}", Thickness=${thickness}, Delta=${newRs - oldRs}`);
      }
    }

    await createItemVersionSnapshot(item);

    //  END OF NEW VERSION

    // Merge updates into item.data
    item.data = { ...item.data.toObject?.() ?? item.data, ...updates };
    item.markModified('data');
    await item.save();

    return res.status(200).json({
      ok: true,
      message: "Material item updated successfully",
      data: item,
      propagation: propagationResult
        ? {
          message: `Auto-updated ${propagationResult.updatedCount} dimension item(s) due to Rs change`,
          updatedItemIds: propagationResult.itemIds,
        }
        : null
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

export const migrateCrockeryMaterialType = async () => {
  try {
    const targetOrgId = "684a57015e439b678e8f6918";
    const targetCategory = "POOJA UNIT";

    // Update only the materialType field for matching documents
    const result = await ItemModel.updateMany(
      {
        organizationId: targetOrgId,
        categoryName: targetCategory,
        materialType: "All" // Target only those that need the change
      },
      {
        $set: { materialType: "plywood" }
      }
    );

    console.log({
      message: "Migration completed successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migration Error:", error);
    console.log({
      message: "Internal Server Error during migration",
      error: error instanceof Error ? error.message : error,
    });
  }
};








export const deleteMaterialItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { itemId } = req.params;

    const role = req.user?.role || ""
    const deletedById = req.user?._id || ""

    // 1. Find the item first (Don't delete yet!)
    const item = await ItemModel.findOne({ _id: itemId });
    if (!item) {
      return res.status(404).json({ ok: false, message: "Material item not found" });
    }

    // 2. Prepare the Backup metadata
    const userModelName = getModelNameByRole(role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 360); // 360-day retention

    const displayName = `${item.categoryName || "Item"}: ${item.data?.Brand || item.data?.brand || "Unnamed"}`;

    // 3. Save the Backup Bundle
    await RateConfigBackupModel.create({
      organizationId: item.organizationId,
      backupType: "SINGLE_ITEM",
      displayName,
      originalId: item._id,
      snapshotData: {
        singleItem: item.toObject(), // Deep copy of the document
      },
      itemCount: 1,
      deletedBy: deletedById,
      deletedUserModel: userModelName,
      expiresAt,
    });

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



export const deleteMaterialCategory = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;

    const role = req.user?.role || ""
    const deletedById = req.user?._id || ""


    // 1. Find the Category and its related Items
    const category = await CategoryModel.findOne({ _id: categoryId });
    if (!category) {
      return res.status(404).json({ ok: false, message: "Category not found" });
    }

    const items = await ItemModel.find({ categoryId });

    // 2. Prepare the Backup metadata
    const userModelName = getModelNameByRole(role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 360);

    // 3. Save the "Category + Items" Bundle
    await RateConfigBackupModel.create({
      organizationId: category.organizationId,
      backupType: "CATEGORY_BUNDLE",
      displayName: category.name,
      originalId: category._id,
      snapshotData: {
        category: category.toObject(),
        items: items.map(item => item.toObject()), // Snapshot all related items
      },
      itemCount: items.length,
      deletedBy: deletedById,
      deletedUserModel: userModelName,
      expiresAt,
    });


    const isDeleted = await CategoryModel.findByIdAndDelete(categoryId);

    if (!isDeleted) {
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






// Controller to update scope-related fields (whatsIncluded, whatsNotIncluded, disclaimer)
export const updateCategoryDescriptions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { categoryId } = req.params;
    const { field, content } = req.body; // 'field' will be 'whatsIncluded', etc.

    // 1. Validation
    const allowedFields = ["whatsIncluded", "whatsNotIncluded", "disclaimer"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        ok: false,
        message: `Invalid field. Allowed fields are: ${allowedFields.join(", ")}`,
      });
    }

    // 2. Update the specific category
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      categoryId,
      { [field]: content }, // Dynamic key update
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ ok: false, message: "Category not found" });
    }

    return res.status(200).json({
      ok: true,
      message: `${field} updated successfully`,
      data: updatedCategory,
    });
  } catch (error: any) {
    console.error("Error updating category scope:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};