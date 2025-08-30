import { Request, Response } from "express";
import { RoleBasedRequest } from "../../../types/types";
import { InventoryModel } from "../../../models/Stage Models/Inventory Model/inventroy.model";
import {Types} from "mongoose"


export const createInventorySubItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { itemName, unit, totalQuantity, note } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: "Not Authorized" });
    }

    if (!itemName || itemName.trim() === "") {
      return res.status(400).json({ ok: false, message: "itemName is required." });
    }

    // resolve createModel based on role
    let createModel = "";
    switch (user.role) {
      case "owner":
        createModel = "UserModel";
        break;
      case "CTO":
        createModel = "CTOModel";
        break;
      case "staff":
        createModel = "StaffModel";
        break;
      case "worker":
        createModel = "WorkerModel";
        break;
      default:
        createModel = "UserModel"; // fallback
    }

    // Find or create the inventory doc for project
    // let inventoryDoc = await InventoryModel.findOne({ projectId });
    // if (!inventoryDoc) {
    //   inventoryDoc = new InventoryModel({ projectId, subItems: [] });
    // }

    // // prepare subitem
    // const newSubItem = {
    //   itemName,
    //   unit: unit || null,
    //   totalQuantity: totalQuantity || 0,
    //   remainingQuantity: totalQuantity || 0, // initially same
    //   usedQuantity: 0,
    //   performedBy:  new Types.ObjectId(user._id),
    //   createModel,
    //   note: note || null,
    // };

    // inventoryDoc.subItems.push(newSubItem);
    // await inventoryDoc.save();



     // Find or create the inventory doc for project to nsdrte wthout the duplicate items
    let inventoryDoc = await InventoryModel.findOne({ projectId });
    if (!inventoryDoc) {
      inventoryDoc = new InventoryModel({ projectId, subItems: [] });
    }

    // 🔎 check for duplicate itemName (case-insensitive)
    const alreadyExists = inventoryDoc.subItems.some(
      (sub: any) => sub.itemName.toLowerCase() === itemName.toLowerCase()
    );

    if (alreadyExists) {
      return res.status(400).json({
        ok: false,
        message: `Item '${itemName}' already exists in this project's inventory.`,
      });
    }

    // prepare subitem
    const newSubItem = {
      itemName,
      unit: unit || null,
      totalQuantity: totalQuantity || 0,
      remainingQuantity: totalQuantity || 0, // initially same
    //   usedQuantity: 0,
      performedBy: new Types.ObjectId(user._id),
      createModel,
      note: note || null,
    };

    inventoryDoc.subItems.push(newSubItem);
    await inventoryDoc.save();


    // shorter way
     // Single DB call: only insert if no subItem with same itemName exists
    // const updatedDoc = await InventoryModel.findOneAndUpdate(
    //   {
    //     projectId,
    //     "subItems.itemName": { $ne: itemName }, // ensures no duplicate itemName
    //   },
    //   {
    //     $push: { subItems: newSubItem },
    //     $setOnInsert: { projectId }, // create doc if it doesn't exist
    //   },
    //   { new: true, upsert: true }
    // );


    return res.status(201).json({
      ok: true,
      message: "Inventory sub-item added successfully.",
      data: inventoryDoc,
    });
  } catch (error: any) {
    console.error("Error in createInventorySubItem:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const updateInventorySubItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, subItemId } = req.params;
    const { itemName, totalQuantity, note , unit} = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: "Not Authorized" });
    }

    // resolve createModel
    let createModel = "";
    switch (user.role) {
      case "owner":
        createModel = "UserModel";
        break;
      case "CTO":
        createModel = "CTOModel";
        break;
      case "staff":
        createModel = "StaffModel";
        break;
      case "worker":
        createModel = "WorkerModel";
        break;
      default:
        createModel = "UserModel"; // fallback
    }

    const inventoryDoc = await InventoryModel.findOne({ projectId });
    if (!inventoryDoc) {
      return res.status(404).json({ ok: false, message: "Inventory not found for this project." });
    }

    const subItem = (inventoryDoc.subItems as any).id(subItemId);
    if (!subItem) {
      return res.status(404).json({ ok: false, message: "Sub-item not found." });
    }

  
     // ✅ Check for duplicate itemName
    if (itemName && itemName !== subItem.itemName) {
      const duplicate = inventoryDoc.subItems.find(
        (si: any) => si.itemName.toLowerCase() === itemName.toLowerCase() && si._id.toString() !== subItemId
      );
      if (duplicate) {
        return res.status(400).json({
          ok: false,
          message: "Item name already exists for this project.",
        });
      }
      subItem.itemName = itemName;
    }

    if (note !== undefined) subItem.note = note;
    if (unit !== undefined) subItem.unit = unit;
    if (totalQuantity !== undefined) {
      // Adjust remainingQuantity based on new total
        const used = subItem.totalQuantity - subItem.remainingQuantity; // already consumed
      subItem.totalQuantity = totalQuantity;
    //   subItem.remainingQuantity = totalQuantity; // ensure not negative
        subItem.remainingQuantity = Math.max(totalQuantity - used, 0); // ensure not negative

    }


    // track performedBy
    subItem.performedBy = new Types.ObjectId(user._id);
    subItem.createModel = createModel;

    await inventoryDoc.save();




    // shorter version in single db call
    // Build the update object
    // const updateObj: any = {
    //   "subItems.$.performedBy": new Types.ObjectId(user._id),
    //   "subItems.$.createModel": createModel,
    // };

    // if (note !== undefined) updateObj["subItems.$.note"] = note;
    // if (totalQuantity !== undefined) {
    //   // We cannot calculate remainingQuantity directly in Mongo, so fetch used in pipeline style
    //   // But for simplicity, we assume frontend sends remainingQuantity adjustment separately if needed
    //   updateObj["subItems.$.totalQuantity"] = totalQuantity;
    // }

    // if (itemName) updateObj["subItems.$.itemName"] = itemName;

    // // Single DB call
    // const updatedDoc = await InventoryModel.findOneAndUpdate(
    //   {
    //     projectId,
    //     "subItems._id": subItemId,
    //     ...(itemName && {
    //       "subItems": { 
    //         $not: { $elemMatch: { itemName: itemName, _id: { $ne: subItemId } } } 
    //       }
    //     }) // ensure no duplicate name exists
    //   },
    //   {
    //     $set: updateObj,
    //   },
    //   { new: true }
    // );

    return res.status(200).json({
      ok: true,
      message: "Sub-item updated successfully.",
      data: subItem,
    });
  } catch (error: any) {
    console.error("Error in updateInventorySubItem:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



export const deleteInventorySubItem = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, subItemId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: "Not Authorized" });
    }

    // Find inventory doc and pull the subItem in one call
    const updatedInventory = await InventoryModel.findOneAndUpdate(
      { projectId },
      { $pull: { subItems: { _id: subItemId } } },
      { new: true }
    );

    if (!updatedInventory) {
      return res.status(404).json({ ok: false, message: "Inventory not found for this project." });
    }

    // Check if deletion actually happened
    const wasDeleted = !(updatedInventory.subItems as any).id(subItemId);
    if (!wasDeleted) {
      return res.status(404).json({ ok: false, message: "Sub-item not found." });
    }

    return res.status(200).json({
      ok: true,
      message: "Sub-item deleted successfully.",
      data: updatedInventory.subItems,
    });
  } catch (error: any) {
    console.error("Error in deleteInventorySubItem:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



export const getInventoryDetails = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
   

    const inventory = await InventoryModel.findOne({ projectId }).populate("subItems.performedBy");

    if (!inventory) {
      return res.status(200).json({ ok: true, message: "No inventory found for this project.", data:{
        projectId,
        subItems:[]
      } });
    }

    return res.status(200).json({
      ok: true,
      message: "Inventory details fetched successfully.",
      data: inventory,
    });
  } catch (error: any) {
    console.error("Error in getInventoryDetails:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};





export const updateInventoryRemainingQuantity = async ({itemName, orderedQuantity}:{
  itemName: string,
  orderedQuantity: number
}) => {
  try {
    await InventoryModel.updateOne(
      { "subItems.itemName": itemName.toLowerCase() },
      {
        $inc: {
          "subItems.$.remainingQuantity": -orderedQuantity,
        },
      }
    ).exec();

    console.log(
      `Inventory updated: Item "${itemName}" reduced by ${orderedQuantity}`
    );
  } catch (error) {
    // don't throw — just log
    console.error(
      `Failed to update inventory for "${itemName}":`,
      (error as Error).message
    );
  }
};



// use case
 // Send response immediately
    // res.status(201).json({
    //   success: true,
    //   message: "Ordering material created successfully",
    //   data: newOrder,
    // });
 // Async fire-and-forget inventory update

    // updateInventoryRemainingQuantity(itemName, orderedQuantity);

