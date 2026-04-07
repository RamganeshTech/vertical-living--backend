// import { RateConfigBackupModel } from "../models/BackupModel"; // Adjust path

import { Response } from "express";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import { RateConfigBackupModel } from "../../../models/Quote Model/RateConfigBackup_model/rateConfigBackup.model";
import { RoleBasedRequest } from "../../../types/types";
import { getModelNameByRole } from "../../../utils/common features/utils";

 
export const getRateConfigBackups = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = req.query.organizationId
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [backups, totalCount] = await Promise.all([
      RateConfigBackupModel.find({ organizationId })
        .sort({ createdAt: -1 })
        // ⭐️ Populate dynamically based on the stored model name
        .populate({ path: "deletedBy", select: " email profileImage username clientName staffName CTOName workerName " }) 
        .skip(skip)
        .limit(limit)
        .lean(),
      RateConfigBackupModel.countDocuments({ organizationId })
    ]);


    // 2. Normalize the data for the frontend
    const formattedBackups = backups.map((backup: any) => {
      // Check if deletedBy exists (in case the user's account was permanently deleted)
      if (backup.deletedBy) {
        // Find whichever name field exists and assign it to a unified 'name' property
        backup.deletedBy.name = 
          backup.deletedBy.username || 
          backup.deletedBy.staffName || 
          backup.deletedBy.CTOName || 
          backup.deletedBy.workerName || 
          backup.deletedBy.clientName || 
          "Unknown User";
      } else {
        // Fallback if the user account itself no longer exists in the DB
        backup.deletedBy = { name: "Deleted User", email: "" };
      }
      return backup;
    });


    return res.status(200).json({
      ok: true,
      data: {
        backups: formattedBackups,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

export const getSingleRateConfigBackup = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { backupId } = req.params;

    const backup = await RateConfigBackupModel.findOne({ _id: backupId })
      .populate({ 
          path: "deletedBy", 
          select: "email profileImage username clientName staffName CTOName workerName" 
      })
      .lean();

    if (!backup) {
      return res.status(404).json({ ok: false, message: "Backup record not found" });
    }


    // Normalize the user name for the frontend
    if (backup.deletedBy) {
        const populatedUser = backup.deletedBy as any;

     // 2. Read and set the properties using the casted variable
      populatedUser.name = 
        populatedUser.username || 
        populatedUser.staffName || 
        populatedUser.CTOName || 
        populatedUser.workerName || 
        populatedUser.clientName || 
        "Unknown User";

    } else {
      (backup as any).deletedBy = { name: "Deleted User", email: "" };
    }

    return res.status(200).json({
      ok: true,
      data: backup
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};


export const restoreFromBackup = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { backupId} = req.params;

    // 1. Find the backup envelope
    const backup = await RateConfigBackupModel.findOne({ _id: backupId });
    if (!backup) return res.status(404).json({ ok: false, message: "Backup record not found" });

    const { backupType, snapshotData } = backup;

    // --- CASE A: Restoring a Single Item ---
    if (backupType === "SINGLE_ITEM") {
      const itemToRestore = snapshotData.singleItem;

      // Ensure the category still exists before restoring the item
      const categoryExists = await CategoryModel.findById(itemToRestore.categoryId);
      if (!categoryExists) {
        return res.status(400).json({ 
          ok: false, 
          message: "Cannot restore item: The parent Category no longer exists. Restore the Category first." 
        });
      }

      // Re-insert using the original ID
      await ItemModel.create(itemToRestore);
    } 

    // --- CASE B: Restoring an Entire Category Bundle ---
    else if (backupType === "CATEGORY_BUNDLE") {
      const { category, items } = snapshotData;

      // 1. Restore the Category first
      await CategoryModel.create(category);

      // 2. Restore all items using insertMany
      // This is high-performance and preserves all IDs and relationships
      if (items && items.length > 0) {
        await ItemModel.insertMany(items);
      }
    }

    // 3. ⭐️ IMPORTANT: Delete the backup record after a successful restore
    // This prevents the user from "Double Restoring" and creating duplicate IDs
    await RateConfigBackupModel.findByIdAndDelete(backupId);

    return res.status(200).json({
      ok: true,
      message: `Successfully restored ${backup.displayName}`,
    });

  } catch (error: any) {
    console.error("Restore Error:", error);
    
    // Handle duplicate ID errors (if the user manually recreated the item)
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        message: "Restore failed: An item with this ID or unique name already exists in your live database.",
      });
    }

    return res.status(500).json({ ok: false, error: error.message });
  }
};