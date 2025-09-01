// utils/recycle.utils.ts

import { InventoryModel } from "../../../../models/Stage Models/Inventory Model/inventroy.model";
import { RecycleModel } from "../../../../models/Stage Models/Inventory Model/RecycleMaterial Model/recycleMaterials.model";
import { Types } from "mongoose"
import { RoleBasedRequest } from "../../../../types/types";
import { Response } from "express";

/**
 * Add current remaining inventory into RecycleModel for the given project.
 * This is idempotent: repeated calls overwrite the project's recycle subItems
 * with the current inventory remaining values (no double-count).
 */
export const addToRecycleMaterials = async ({ projectId , organizationId}: { projectId: string, organizationId:string }) => {
    try {
        // Step 1. Load inventory doc for the project
        const inventoryDoc = await InventoryModel.findOne({ projectId }).lean();
        // If no inventory -> ensure recycle doc exists with empty subItems (or just exit)
        if (!inventoryDoc || !Array.isArray(inventoryDoc.subItems) || inventoryDoc.subItems.length === 0) {
            // Option A: Clear existing recycle doc for project (keeps doc but zeroes subItems)
            await RecycleModel.findOneAndUpdate(
                { projectId, organizationId },
                { $set: { subItems: [] } },
                { upsert: true }
            ).exec();
            return;
        }

        // Step 2. Build normalized subItems array from inventory (only >0 remaining)
        const newSubItems = inventoryDoc.subItems
            .filter((s: any) => typeof s.remainingQuantity === "number" && s.remainingQuantity > 0)
            .map((s: any) => ({
                itemName: (s.itemName || "").trim(),         // keep original case or toLowerCase() if you prefer
                unit: s.unit || null,
                remainingQuantity: Number(s.remainingQuantity) || 0,
            }));

        // Step 3. Replace the recycle doc's subItems array in one atomic call
       const result =  await RecycleModel.findOneAndUpdate(
            { projectId, organizationId },
            { $set: { subItems: newSubItems } },
            { upsert: true, new: true }
        ).exec();

        // optional: log
        console.log(`♻️ Recycle updated for project ${projectId}. Items: ${newSubItems.length}`);
        return result
    } catch (err) {
        console.error("♻️ addToRecycleMaterials failed:", (err as Error).message);
        // Do not rethrow if you are calling this as fire-and-forget - log is enough.
        // throw err; // optional: remove throw if you want completely swallow
    }
};



export const updateRecycleMaterialManually = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, organizationId } = req.params;

    if (!projectId || !organizationId) {
      return res.status(400).json({ ok: false, message: "projectId and organizationId are required" });
    }

    await addToRecycleMaterials({ projectId, organizationId });

    return res.status(200).json({ ok: true, data:[], message:"sync successfully created"  });

  } catch (err: any) {
    console.error("♻️ regenerateRecycleMaterials failed:", err.message);
    return res.status(500).json({ ok: false, message: "Failed to regenerate recycle materials" });
  }
};

export const getProjectMaterials = async (req: RoleBasedRequest, res: Response): Promise<any>  => {
    try {
        const { projectId, organizationId } = req.params;

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ ok: false, message: "Invalid projectId" });
        }

        
        const projectMaterials = await RecycleModel.findOne({projectId});

        return res.status(200).json({ ok: true, data: projectMaterials });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const getGlobalMaterials = async (req: RoleBasedRequest, res: Response): Promise<any>  => {
    try {

                const { organizationId } = req.params;

        const globalMaterials = await RecycleModel.aggregate([
              { $match: { organizationId:  new Types.ObjectId(organizationId) } },
            { $unwind: "$subItems" },
            {
                $group: {
                    _id: "$subItems.itemName",
                    totalRemaining: { $sum: "$subItems.remainingQuantity" },
                    unit: { $first: "$subItems.unit" },
                    projectCount: { $addToSet: "$projectId" } // how many projects have it
                }
            },
            {
                $project: {
                    name: "$_id",
                    totalRemaining: 1,
                    unit: 1,
                    projectCount: { $size: "$projectCount" },
                    _id: 0
                }
            }
        ]);

        return res.status(200).json({ ok: true, data: globalMaterials });
    } catch (error:any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};
