import { Request, Response } from "express";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { OrderMaterialHistoryModel, OrderSubItems } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import { updateInventoryRemainingQuantity } from "../Inventory controllers/inventory.controller";
import { InventoryModel } from "../../../models/Stage Models/Inventory Model/inventroy.model";
import { generatePublicOrderHistoryPdf } from "./pdfOrderHistory.controller";
import redisClient from "../../../config/redisClient";
import ProjectModel from "../../../models/project model/project.model";
import { getProjectDetailsUtil } from "../../Util Controller/utilProject.controller";
import { getProjectUtil } from "../../project controllers/project.controller";

export const publicaddSubItemToUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { subItemName, quantity, unit } = req.body;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid projectId or unitId" });
        }

        if (!subItemName?.trim()) {
            return res.status(400).json({ ok: false, message: "Mateial Item is mandatory" });
        }


        if (quantity === null) {
            return res.status(400).json({ ok: false, message: "Missing Quantity" });
        }

        if (!unit) {
            return res.status(400).json({ ok: false, message: "Missing Unit" });
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

       


        const publicUnits = orderDoc?.publicUnits?.subItems || [];

        const isExists = (publicUnits || []).find((unit: OrderSubItems) => {
            console.log("unit", unit.subItemName)
            return unit?.subItemName?.toLowerCase()?.trim() === subItemName?.toLowerCase()?.trim()
        })


        if (isExists) {
            return res.status(400).json({ message: "Material item already exists with the same name", ok: false })
        }

        // 🔹 Find max number used across ALL units' subItems
        let maxNumber = 0;
        publicUnits.forEach((sub: any) => {
            if (sub.refId) {
                const num = parseInt(sub.refId.replace(/^\D+/, ""), 10); // remove prefix, take number
                if (!isNaN(num)) {
                    maxNumber = Math.max(maxNumber, num);
                }
            }
        });

        // New refId = prefix + (maxNumber + 1)
        let prefix = subItemName.substring(0, 3).toUpperCase();
        if (prefix.length < 3) {
            prefix = prefix.padEnd(3, "A"); // e.g., "TV" -> "TVA"
        }
        const refId = `${prefix}-${maxNumber + 1}`;

        // Add new subItem
        publicUnits.push({
            subItemName: subItemName?.trim(),
            refId,
            quantity,
            unit
        });

        // ✨ ADD THESE TWO LINES ✨
        orderDoc.publicUnitsVersion = (orderDoc.publicUnitsVersion || 0) + 1;
        orderDoc.needsStaffReview = true;


        // Add new subItem
        // unitObj.subItems.push({ subItemName: subItemName?.trim(), refId, quantity, unit });

        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        res.json({ ok: true, message: "SubItem added", subItems: publicUnits });

        updateInventoryRemainingQuantity({ itemName: subItemName, orderedQuantity: quantity })
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const publicupdateSubItemInUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, subItemId } = req.params;
        const { subItemName, quantity, unit } = req.body;
        // console.log("subitem name", subItemName)
        if (!projectId || !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        if (!subItemName?.trim()) {
            return res.status(400).json({ message: "material name is requried", ok: false })
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        const publicUnits = orderDoc?.publicUnits?.subItems || [];
        if (publicUnits?.length === 0) {
            return res.status(404).json({ ok: false, message: "No items to update" });
        }


        const subItemObj = (publicUnits as any).id(subItemId);

        if (!subItemObj) {
            return res.status(404).json({ ok: false, message: "SubItem not found" });
        }


        // const isExists = unitObj.subItems.find((unit: OrderSubItems) => {
        //     console.log("unit", unit.subItemName)
        //     return unit?.subItemName?.toLowerCase() === subItemName?.toLowerCase()
        // })


        // if (isExists) {
        //     return res.status(400).json({ message: "item already exists", ok: false })
        // }


        // ---- INVENTORY UPDATE PART ----
        // Track old quantity before updating
        const oldQuantity = subItemObj.quantity || 0;


        subItemObj.subItemName = subItemName.trim();
        if (quantity !== null) subItemObj.quantity = quantity;
        if (!unit !== undefined) subItemObj.unit = unit;

        // ✨ ADD THESE TWO LINES ✨
        orderDoc.publicUnitsVersion = (orderDoc.publicUnitsVersion || 0) + 1;
        orderDoc.needsStaffReview = true;


        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        res.status(200).json({ ok: true, message: "SubItem updated", subItem: subItemObj });

        // ---- INVENTORY UPDATE PART (background) ----
        if (quantity !== null && quantity !== oldQuantity) {
            const diff = quantity - oldQuantity;

            (async () => {
                try {
                    if (diff > 0) {
                        await updateInventoryRemainingQuantity({
                            itemName: subItemName.trim(),
                            orderedQuantity: diff,
                        });
                    } else if (diff < 0) {
                        await InventoryModel.updateOne(
                            { "subItems.itemName": subItemName.trim() },
                            { $inc: { "subItems.$.remainingQuantity": Math.abs(diff) } }
                        ).exec();
                        console.log(
                            `Inventory restored: Item "${subItemName}" increased by ${Math.abs(diff)}`
                        );
                    }
                } catch (err) {
                    console.error("Background inventory update failed:", err);
                }
            })();
        }
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

export const publicgetSubItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;


        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid Project ID" });
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        const publicUnits: any = orderDoc?.publicUnits || [];

        return res.json({ ok: true, message: "public units retrived", data: publicUnits });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const publicdeleteSubItemFromUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, subItemId } = req.params;

        if (!projectId ||
            !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        const publicUnits: any = orderDoc?.publicUnits?.subItems || [];
        if (publicUnits?.length === 0) {
            return res.status(404).json({ ok: false, message: "No items to delete" });
        }

        const subItemObj = (publicUnits as any).id(subItemId);
        if (!subItemObj) {
            return res.status(404).json({ ok: false, message: "SubItem not found" });
        }

        const { subItemName, quantity } = subItemObj;


        publicUnits.pull({ _id: subItemId });
        // ✨ ADD THESE TWO LINES ✨
        orderDoc.publicUnitsVersion = (orderDoc.publicUnitsVersion || 0) + 1;
        orderDoc.needsStaffReview = true;

        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        res.json({ ok: true, message: "SubItem deleted", subItems: publicUnits });

        // ---- BACKGROUND INVENTORY UPDATE ----
        (async () => {
            try {
                // add back deleted quantity to inventory
                await InventoryModel.updateOne(
                    { "subItems.itemName": subItemName.trim() },
                    { $inc: { "subItems.$.remainingQuantity": quantity } }
                ).exec();

                console.log(`Inventory restored: "${subItemName}" increased by ${quantity}`);
            } catch (err) {
                console.error("Inventory update failed (deleteSubItemFromUnit):", err);
            }
        })();
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const generatePublicOrderMaterialPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, organizationId, orderItemId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }

        const result = await generatePublicOrderHistoryPdf(projectId, organizationId, orderItemId);

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: result.data.orderHistory })

        res.status(200).json(result);
    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
}



export const submitPublicOrders = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }


        const orderDoc = await OrderMaterialHistoryModel.findOne(
            { projectId }
        );

        if (!orderDoc) {
            return res.status(404).json({ message: "PDF not found", ok: false });
        }

        let nextNumber = 1;
        const isNewPdf = Array.isArray(orderDoc.orderedItems) && orderDoc.orderedItems.length > 0;

        if (isNewPdf) {
            // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
            const numbers = orderDoc.orderedItems.map(ele => {
                const match = ele.orderMaterialNumber?.match(/-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0; // Extract the number part
            });

            // Find the max number and increment
            nextNumber = Math.max(...numbers, 0) + 1;
        }


        const currentYear = new Date().getFullYear()


        // Always 3-digit format
        const paddedNumber = String(nextNumber).padStart(3, "0");
        const rawProjectId = (orderDoc.projectId as any)._id.toString().slice(-3);

        const orderNumber = `ORD-${rawProjectId}-${currentYear}-${paddedNumber}`;

        // const selectedUnits = [{
        //     unitId: null,
        //     category: "",
        //     image: null,
        //     customId: null,
        //     quantity: 1,
        //     unitName: "",
        //     dimention: null,
        //     singleUnitCost: 0,
        //     subItems: orderDoc?.publicUnits?.subItems || []
        // }];


        const subItems = orderDoc?.publicUnits?.subItems || []
        const shopDetails = orderDoc?.publicUnits?.shopDetails;
        const deliveryLocationDetails = orderDoc.deliveryLocationDetails;
        const images = orderDoc.images;

        if (orderDoc?.orderedItems && Array.from(orderDoc.orderedItems) && orderDoc.orderedItems.length > 0) {
            orderDoc.orderedItems.push({
                // selectedUnits,
                subItems:subItems,
                shopDetails,
                deliveryLocationDetails,
                images,
                priority: null,
                pdfLink: [],
                orderMaterialNumber: orderNumber,
                isSyncWithProcurement: false,
                createdAt: new Date(),
                isPublicOrder: true
            })
        } else {
            orderDoc.orderedItems = [{
                // selectedUnits,
                subItems:subItems,
                shopDetails,
                deliveryLocationDetails,
                images,
                pdfLink: [],
                priority: null,
                orderMaterialNumber: orderNumber,
                isSyncWithProcurement: false,
                createdAt: new Date(),
                isPublicOrder: true

            }]
        }



        orderDoc.publicUnits.subItems = []
        await orderDoc.save()


        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.status(200).json({ data: orderDoc, message: "updated in the orderedItems", ok: true });

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};




export const updatePublicShopDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;



        // if (!shopName || !address || !contactPerson || !phoneNumber) {
        //     return res.status(400).json({ ok: false, message: "All shop details are required." });
        // }


        if (phoneNumber?.trim() && phoneNumber.length !== 10) {
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
            { projectId },
            {
                $set: {
                    "publicUnits.shopDetails": { shopName, address, contactPerson, phoneNumber },
                },
            },
            { new: true, upsert: true }
        );

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to update shop details." });
        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })



        res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.shopDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

export const getProjectforPublicUsage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params

        if (!organizationId) {
            res.status(400).json({ message: "organization Id is required", ok: false })
            return
        }

        const data = await getProjectUtil(organizationId)
        res.status(200).json(data);
    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }

}