import { MaterialItemDoc } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import { ItemVersionModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigurationAdminVersion.model";
import { Request, Response } from "express";

// Helper function to create a version snapshot
export const createItemVersionSnapshot = async (originalItem: MaterialItemDoc): Promise<void> => {
  try {

    const plainItem = typeof originalItem.toObject === 'function' 
      ? originalItem.toObject() 
      : originalItem;

      // 2. Safely deep clone the Mixed data field
    let clonedData;
    try {
      // Try the modern native way first (preserves Dates, Maps, Sets)
      clonedData = structuredClone(plainItem.data || {});
    } catch (cloneError) {
      // Fallback: If structuredClone crashes (usually due to a Mongoose ObjectId),
      // safely stringify it instead.
      clonedData = JSON.parse(JSON.stringify(plainItem.data || {}));
    }


    // 3. Save the snapshot
    await ItemVersionModel.create({
      organizationId: plainItem.organizationId,
      categoryId: plainItem.categoryId,
      itemId: plainItem._id,
      materialType: plainItem.materialType,
      categoryName: plainItem.categoryName,
      data: clonedData, 
    });

    // await ItemVersionModel.create({
    //   organizationId: originalItem.organizationId,
    //   categoryId: originalItem.categoryId,
    //   itemId: originalItem._id,
    //   materialType:originalItem.materialType,
    //   categoryName: originalItem.categoryName,
    //   // Use toObject() if it's a mongoose document, to ensure we get a clean plain object
    //   data: originalItem.data?.toObject ? originalItem.data.toObject() : originalItem.data, 
    // });
  } catch (error: any) {
    console.error("Failed to save item version history:", error);
    throw new Error(`Version history creation failed: ${error.message}`);
  }
};



export const getItemVersions = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Setup Pagination variables (Defaults to page 1, 10 items per page)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;  

    
    // 2. Setup dynamic filters
    const { itemId, categoryId, organizationId } = req.query;
    const query: any = {};

    // If the frontend passes an itemId, it will only return history for that specific item
    if (itemId) query.itemId = itemId;
    if (categoryId) query.categoryId = categoryId;
    if (organizationId) query.organizationId = organizationId;

    // 3. Fetch data and total count in parallel for performance
    const [versions, totalCount] = await Promise.all([
      ItemVersionModel.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first (descending)
        .skip(skip)
        .limit(limit)
        .lean(), // .lean() converts Mongoose docs to plain JS objects, making the query much faster
      
      ItemVersionModel.countDocuments(query)
    ]);

    // 4. Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // 5. Return structured response
    return res.status(200).json({
      ok: true,
      message: "Item versions retrieved successfully",
      data: {
        versions,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching item versions:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};