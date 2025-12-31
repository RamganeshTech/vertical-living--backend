import { Request, Response } from "express";
import mongoose, { Types } from "mongoose"
import redisClient from "../../../config/redisClient";
// import { SelectedModularUnitModel } from "../../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
import { OrderedMaterialSingle, OrderMaterialHistoryModel, OrderSubItems } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { syncMaterialArrivalNew } from "../MaterialArrival controllers/materialArrivalCheckNew.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
// import MaterialRoomConfirmationModel, { IMaterialRoom, IMaterialSubItems } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
// import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
// import { getStageSelectionUtil } from "../../Modular Units Controllers/StageSelection Controller/stageSelection.controller";
import { IRoomItemEntry } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes";
import { SelectedExternalModel } from './../../../models/externalUnit model/SelectedExternalUnit model/selectedExternalUnit.model';
import { RoleBasedRequest } from "../../../types/types";
import { generateOrderingToken } from "../../../utils/generateToken";
import { generateOrderHistoryPDF } from "./pdfOrderHistory.controller";
import { updateInventoryRemainingQuantity } from "../Inventory controllers/inventory.controller";
import { InventoryModel } from "../../../models/Stage Models/Inventory Model/inventroy.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
import { IFileItem } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import ProcurementModelNew from "../../../models/Department Models/ProcurementNew Model/procurementNew.model";
import { syncAccountingRecord } from "../../Department controllers/Accounting Controller/accounting.controller";


export const restoreInventoryQuantities = async ({
    projectId,
    subItems,
}: {
    projectId: string;
    subItems: { subItemName: string; quantity: number }[];
}) => {
    try {
        const aggregated: Record<string, number> = {};

        subItems.forEach(({ subItemName, quantity }) => {
            const key = subItemName.toLowerCase().trim();
            if (!aggregated[key]) aggregated[key] = 0;
            aggregated[key] += quantity;
        });

        const bulkOps = Object.entries(aggregated).map(([subItemName, quantity]) => ({
            updateOne: {
                filter: {
                    projectId,
                    "subItems.itemName": subItemName
                },
                update: {
                    $inc: {
                        "subItems.$.remainingQuantity": quantity
                    }
                }
            }
        }));

        if (bulkOps.length) {
            await InventoryModel.bulkWrite(bulkOps);
            console.log("✅ Inventory restored:", bulkOps.length);
        }
    } catch (error: any) {
        console.error("❌ Inventory restore failed:", error.message);
    }
};


export const bulkDeductInventoryQuantities = async ({
    projectId,
    subItems,
}: {
    projectId: string;
    subItems: { subItemName: string; quantity: number }[];
}) => {
    try {
        // Aggregate quantities per unique item
        const quantityMap: Record<string, number> = {};

        subItems.forEach(({ subItemName, quantity }) => {
            const key = subItemName.toLowerCase().trim();
            if (!quantityMap[key]) {
                quantityMap[key] = 0;
            }
            quantityMap[key] += quantity || 0;
        });



        console.log("quantityMap for inventory", quantityMap)

        // Create efficient bulk write operations
        const bulkOps = Object.entries(quantityMap).map(([itemName, totalQty]) => ({
            updateOne: {
                filter: {
                    projectId,
                    "subItems.itemName": itemName,
                },
                update: {
                    $inc: {
                        "subItems.$.remainingQuantity": -Math.abs(totalQty),
                    },
                },
            },
        }));
        console.log("bulkOps for inventory", bulkOps)

        if (bulkOps.length > 0) {
            await InventoryModel.bulkWrite(bulkOps);
            console.log(`Inventory updated for ${bulkOps.length} sub-items.`);
        }
    } catch (error: any) {
        console.error("❌ Error updating inventory:", error.message);
    }
};


// OLD VERSION
// export const syncOrderingMaterialsHistory = async (projectId: string) => {
//     let existing = await OrderMaterialHistoryModel.findOne({ projectId });

//     // Fetch the stage selection mode
//     // const stageSelection = await getStageSelectionUtil(projectId);
//     // const mode = stageSelection?.mode || "Manual Flow";

//     let selected: OrderedMaterialSingle[] = [];
//     let totalCost = 0;

//     // if (mode?.mode === "Modular Units") {
//     //     const units = await SelectedModularUnitModel.findOne({ projectId });

//     //     const isExternalExists = await SelectedExternalModel.findOne({ projectId })

//     //     // external units condition
//     //     if (isExternalExists && isExternalExists?.selectedUnits?.length) {
//     //         let selectedUnits = isExternalExists.selectedUnits

//     //         // const findSingleQuantityPrice = (height: number, width: number, depth: number, unitPrice: number) => {
//     //         //     const h = Number(height);
//     //         //     const w = Number(width);
//     //         //     const d = Number(depth);

//     //         //     const heightFt = h / 304.8;
//     //         //     const widthFt = w / 304.8;
//     //         //     const depthFt = d / 304.8;

//     //         //     const cubicFeet = heightFt * widthFt * depthFt;
//     //         //     // console.log("cal cubic feet", cubicFeet)
//     //         //     // const price = cubicFeet * unitPrice * quantity;
//     //         //     // console.log("cal price before ceilt", price)
//     //         //     // return Math.floor(price); // No decimals, always rounded up


//     //         //     const pricePerUnit = Math.ceil(cubicFeet * unitPrice); // ⬅️ round per unit
//     //         //     return pricePerUnit

//     //         // }
//     //         // console.log("Geetting inside of selected Units in the external block")

//     //         for (let unit of selectedUnits) {
//     //             // const { _id, ...res } = (unit as any).toObject()
//     //             const { unitCode, unitName, price, category, dimention, quantity, image, totalPrice } = unit
//     //             const { height = 0, width = 0, depth = 0 } = dimention as any || {}

//     //             // const singleUnitCost = findSingleQuantityPrice(height, width, depth, price)

//     //             let externalUnits: any = {
//     //                 customId: unitCode,
//     //                 // name: unitName,
//     //                 unitName,
//     //                 category: category,
//     //                 singleUnitCost: totalPrice,
//     //                 quantity: quantity,
//     //                 dimention,
//     //                 unitId: (unit as any)._id,
//     //                 image: image?.url,
//     //                 subItems: []
//     //             }

//     //             selected.push(externalUnits)
//     //             // console.log("selected Units in the external block", selected)
//     //         }
//     //         totalCost = isExternalExists?.totalCost || 0
//     //     }


//     //     // moudlar units condiiton
//     //     if (units) {
//     //         totalCost += units.totalCost || 0;
//     //         const modularUnits = units.selectedUnits.map((doc: any) => {
//     //             const { _id, ...rest } = doc.toObject();
//     //             return { ...rest, dimention: null };
//     //         });

//     //         selected = selected.concat(modularUnits);
//     //     }


//     // } else if (mode?.mode === "Manual Flow") {

//     //     console.log("gettin g into the manual flow")

//     //     // 1. Get material confirmation data (with packages)
//     //     const materialRoomData = await MaterialRoomConfirmationModel.findOne({ projectId }).lean();
//     //     if (!materialRoomData) {
//     //         console.log("material room stage not found");
//     //         return;
//     //     }

//     //     // ✅ pick only the selected package
//     //     const selectedPackageLevel = materialRoomData.packageSelected || "economy";
//     //     const selectedPackage = (materialRoomData.package || []).find(
//     //         (pkg) => pkg.level === selectedPackageLevel
//     //     );

//     //     if (!selectedPackage) {
//     //         console.log("No matching package found:", selectedPackageLevel);
//     //         return;
//     //     }

//     //     const rooms = selectedPackage.rooms || [];

//     //     // 2. Get cost estimation data
//     //     const costEstimationData = await CostEstimationModel.findOne({ projectId }).lean();
//     //     if (!costEstimationData) {
//     //         console.log("cost estimation stage not found");
//     //         return;
//     //     }

//     //     const materialEstimationRooms = costEstimationData.materialEstimation || [];

//     //     // 3. Build cost lookup map by room name + itemName
//     //     const costMap: Record<string, Record<string, number>> = {};
//     //     materialEstimationRooms.forEach((room) => {
//     //         costMap[room.name] = {};
//     //         (room.materials || []).forEach((material) => {
//     //             costMap[room.name][material.key] = material.totalCost || 0;
//     //         });
//     //     });

//     //     // 4. Build selectedUnits array for OrderMaterialHistory
//     //     // const selected: any[] = [];

//     //     rooms.forEach((room: IMaterialRoom) => {
//     //         (room.roomFields || []).forEach((item: any) => {
//     //             const unitName = item.itemName;
//     //             const quantity = item.quantity || 0;
//     //             const unitCost = costMap?.[room.name]?.[item.itemName] || 0;

//     //             if (quantity <= 0) return; // skip zero quantity

//     //             selected.push({
//     //                 unitId: null, // optional if you track IDs
//     //                 category: room.name, // room name as category
//     //                 image: null,
//     //                 customId: null,
//     //                 unitName, // itemName from schema
//     //                 dimention: null,
//     //                 quantity,
//     //                 singleUnitCost: unitCost,

//     //                 // ✅ materialItems become subItems
//     //                 subItems: (item.materialItems || []).map((mat: IMaterialSubItems) => ({
//     //                     materialName: mat.materialName,
//     //                     unit: mat.unit,
//     //                     quantity: mat.quantity,
//     //                     price: mat.price,
//     //                     labourCost: mat.labourCost,
//     //                 })),
//     //             });
//     //         });
//     //     });

//     //     // 5. Calculate total cost
//     //     totalCost = selected.reduce(
//     //         (acc, item) => acc + item.quantity * item.singleUnitCost,
//     //         0
//     //     );

//     //     console.log("slected in the first else condition", selected)


//     // }

//     // Build timer



//     // 1. Get material confirmation data (with packages)
//     const requirementData = await RequirementFormModel.findOne({ projectId }).lean();
//     if (!requirementData) {
//         console.log("❌ Requirement form not found");
//         return;
//     }

//     const requirementRooms = requirementData.rooms || [];

//     // 2. Build selectedItems from requirement data
//     for (const room of requirementRooms) {
//         for (const item of room.items || []) {
//             const { itemName, quantity = 0, unit = "nos" } = item;
//             if (!itemName || quantity <= 0) continue;

//             selected.push({
//                 unitId: null,
//                 category: null,
//                 image: null,
//                 customId: null,
//                 dimention: null,
//                 unitName: itemName,
//                 quantity,
//                 singleUnitCost: 0,
//                 subItems: [], // will try to attach below if already exists
//             });
//         }
//     }

//     // 3. Timer
//     const timer = {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//         reminderSent: false,
//     };

//     // 4. If no existing record ➡️ Create new
//     if (!existing) {

//         existing = new OrderMaterialHistoryModel({
//             projectId,
//             status: "pending",
//             isEditable: true,
//             assignedTo: null,
//             selectedUnits: selected,
//             totalCost,
//             timer,
//             deliveryLocationDetails: {
//                 siteName: "",
//                 address: "",
//                 siteSupervisor: "",
//                 phoneNumber: "",
//             },
//             shopDetails: {
//                 shopName: "",
//                 address: "",
//                 contactPerson: "",
//                 phoneNumber: "",
//             },
//             generatedLink: []
//         });

//     } else {
//         // 5. Update when record exists
//         existing.timer = timer;
//         existing.totalCost = 0; // Always 0 as per requirements

//         for (const newUnit of selected) {
//             // ⚠️ Match using item name
//             const existingUnit = existing.selectedUnits?.find(
//                 (unit: any) => unit.unitName === newUnit.unitName
//             );

//             if (!existingUnit) {
//                 // New item → push
//                 existing.selectedUnits.push(newUnit);
//             } else {
//                 // Exists → check if quantity changed
//                 if (existingUnit.quantity !== newUnit.quantity) {
//                     existingUnit.quantity = newUnit.quantity;
//                 }

//                 if (existingUnit.singleUnitCost !== newUnit.singleUnitCost) {
//                     existingUnit.singleUnitCost = newUnit.singleUnitCost;
//                 }

//                 // Preserve subItems if already exists
//                 newUnit.subItems = existingUnit.subItems || [];
//             }
//         }
//     }

//     // 6. Save record
//     await existing.save();

//     console.log("✅ Synced requirement form to order history");

//     // return existing;

//     // const timer: IOrderHistorytimer = {
//     //     startedAt: new Date(),
//     //     completedAt: null,
//     //     deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//     //     reminderSent: false,
//     // };

//     // if (!existing) {
//     //     const commonOrders = {
//     //         customId: null,
//     //         // name: unitName,
//     //         unitName: "Common Orders",
//     //         category: null,
//     //         singleUnitCost: 0,
//     //         quantity: 0,
//     //         dimention: null,
//     //         unitId: null,
//     //         image: null,
//     //         subItems: []
//     //     }
//     //     selected.push(commonOrders)
//     //     existing = new OrderMaterialHistoryModel({
//     //         projectId,
//     //         status: "pending",
//     //         isEditable: true,
//     //         assignedTo: null,
//     //         timer,
//     //         selectedUnits: selected,
//     //         totalCost,
//     //         genreatedLink: []
//     //     });
//     // } else {
//     //     // existing.timer = timer;
//     //     // existing.totalCost += totalCost;

//     //     // selected.forEach((newUnit: any) => {
//     //     //     const existingUnit = existing?.selectedUnits?.find(
//     //     //         (unit: any) => unit.customId === newUnit.customId
//     //     //     );

//     //     //     if (existingUnit) {
//     //     //         // ✅ Only update quantity if the new unit is modular
//     //     //         if (newUnit.customId.toLowerCase().includes("modular")) {
//     //     //             existingUnit.quantity += newUnit.quantity || 0;
//     //     //         } else {
//     //     //             existing?.selectedUnits.push(newUnit);
//     //     //         }
//     //     //     } else {
//     //     //         // ✅ If not found, push new unit
//     //     //         existing?.selectedUnits.push(newUnit);
//     //     //     }
//     //     // });

//     //     existing.timer = timer;
//     //     existing.totalCost = totalCost;



//     //     console.log("selectedUnits", selected)

//     //     // selected.forEach((newUnit: OrderedMaterialSingle) => {
//     //     for (const newUnit of selected) {
//     //         const existingUnit = existing?.selectedUnits?.find(
//     //             (unit: any) => unit.unitName === newUnit.unitName
//     //         );

//     //         console.log("existing units", existingUnit)
//     //         if (!existingUnit) {
//     //             // ✅ Only update quantity if the new unit is modular
//     //             existing?.selectedUnits.push(newUnit);
//     //         } else {
//     //             // Exists — update quantity only if changed
//     //             if (existingUnit.quantity !== newUnit.quantity) {
//     //                 existingUnit.quantity = newUnit.quantity;
//     //                 // Optional: update cost if it might have changed

//     //                 // // Also update other fields if you want:
//     //                 // existingUnit.category = newUnit.category;
//     //                 // existingUnit.image = newUnit.image;
//     //                 // existingUnit.customId = newUnit.customId;
//     //                 // existingUnit.subItems = newUnit.subItems || [];
//     //             }

//     //             if (existingUnit.singleUnitCost !== newUnit.singleUnitCost) {
//     //                 existingUnit.singleUnitCost = newUnit.singleUnitCost;
//     //             }



//     //             // existingUnit.subItems = newUnit?.subItems || []; // safely replace for simplicity



//     //             // Make sure subItems exist
//     //             const newSubItems = newUnit?.subItems || [];

//     //             const existingRefIds = new Set<string>();
//     //             existingUnit.subItems?.forEach((sub: any) => {
//     //                 if (sub.refId) existingRefIds.add(sub.refId);
//     //             });

//     //             // Step 1: Find max existing number across all selectedUnits
//     //             let maxNumber = 0;
//     //             existing!.selectedUnits.forEach((u: any) => {
//     //                 u.subItems.forEach((sub: any) => {
//     //                     if (sub.refId) {
//     //                         const num = parseInt(sub.refId.replace(/^\D+/, ""), 10);
//     //                         if (!isNaN(num)) {
//     //                             maxNumber = Math.max(maxNumber, num);
//     //                         }
//     //                     }
//     //                 });
//     //             });

//     //             // Step 2: Define prefix from unitName
//     //             let prefix = (newUnit.unitName || "").substring(0, 3).toUpperCase();
//     //             if (prefix.length < 3) prefix = prefix.padEnd(3, "A");

//     //             // Step 3: Process subItems
//     //             const processedSubItems = newSubItems.map((sub: any) => {
//     //                 if (sub.refId && existingRefIds.has(sub.refId)) {
//     //                     // Existing refId: keep it
//     //                     return sub;
//     //                 } else {
//     //                     // Generate new refId
//     //                     maxNumber += 1;
//     //                     const newRefId = `${prefix}-${maxNumber}`;
//     //                     console.log("subItems", sub)
//     //                     return {
//     //                         // ...sub,
//     //                         subItemName: sub.materialName,
//     //                         quantity: sub.quantity,
//     //                         unit: sub.unit,
//     //                         refId: newRefId,
//     //                     };
//     //                 }
//     //             });

//     //             existingUnit.subItems =  processedSubItems;

//     //             await bulkDeductInventoryQuantities({
//     //                 projectId,
//     //                 subItems: processedSubItems.map((sub: any) => ({
//     //                     subItemName: sub.subItemName, // NOT materialName — it's already mapped
//     //                     quantity: sub.quantity,
//     //                 })),
//     //             });

//     //         }
//     //     }
//     // }

//     // await existing.save();
//     await populateWithAssignedToField({
//         stageModel: OrderMaterialHistoryModel,
//         projectId,
//         dataToCache: existing,
//     });
// };


export const syncOrderingMaterialsHistory = async (projectId: string) => {
    let existing = await OrderMaterialHistoryModel.findOne({ projectId });

    // Fetch the stage selection mode
    // const stageSelection = await getStageSelectionUtil(projectId);
    // const mode = stageSelection?.mode || "Manual Flow";

    const timer = {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
    };

    // 4. If no existing record ➡️ Create new
    if (!existing) {

        const currentYear = new Date().getFullYear()

        // Always 3-digit format
        const paddedNumber = String(1).padStart(3, "0");
        const rawProjectId = projectId.toString().slice(-3);

        const newOrderMaterialNumber = `ORD-${rawProjectId}-${currentYear}-${paddedNumber}`;


        const orderMaterialNumber = newOrderMaterialNumber

        existing = new OrderMaterialHistoryModel({
            projectId,
            status: "pending",
            isEditable: true,
            assignedTo: null,
            // selectedUnits: selected,
            orderedItems: [],
            timer,
            deliveryLocationDetails: {
                siteName: "",
                address: "",
                siteSupervisor: "",
                phoneNumber: "",
            },
            currentOrder: {
                orderMaterialNumber: orderMaterialNumber,
                subItems: []
            },
            images: [],
            shopDetails: {
                shopName: "",
                address: "",
                contactPerson: "",
                phoneNumber: "",
            },
            // generatedLink: []
        });
        await existing.save();

    }

    // 6. Save record

    console.log("✅ Synced requirement form to order history");

    await populateWithAssignedToField({
        stageModel: OrderMaterialHistoryModel,
        projectId,
        dataToCache: existing,
    });
};


// start old vrsion of updatig he items
// export const addSubItemToUnit = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, unitId } = req.params;
//         const { subItemName, quantity, unit } = req.body;

//         if (!projectId || !unitId) {
//             return res.status(400).json({ ok: false, message: "Invalid projectId or unitId" });
//         }

//         if (!subItemName?.trim()) {
//             return res.status(400).json({ ok: false, message: "Mateial Item is mandatory" });
//         }


//         if (quantity === null) {
//             return res.status(400).json({ ok: false, message: "Missing Quantity" });
//         }

//         if (!unit) {
//             return res.status(400).json({ ok: false, message: "Missing Unit" });
//         }

//         const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
//         if (!orderDoc) {
//             return res.status(404).json({ ok: false, message: "Order history not found" });
//         }

//         // Find the unit inside selectedUnits by _id
//         const unitObj = (orderDoc.selectedUnits as any).id(unitId);
//         if (!unitObj) {
//             return res.status(404).json({ ok: false, message: "Unit not found in order history" });
//         }



//         const isExists = unitObj.subItems.find((unit: OrderSubItems) => {
//             console.log("unit", unit.subItemName)
//             return unit?.subItemName?.toLowerCase()?.trim() === subItemName?.toLowerCase()?.trim()
//         })


//         if (isExists) {
//             return res.status(400).json({ message: "Material item already exists with the same name", ok: false })
//         }

//         // 🔹 Find max number used across ALL units' subItems
//         let maxNumber = 0;
//         orderDoc.selectedUnits.forEach((u: any) => {
//             u.subItems.forEach((sub: any) => {
//                 if (sub.refId) {
//                     const num = parseInt(sub.refId.replace(/^\D+/, ""), 10); // remove prefix, take number
//                     if (!isNaN(num)) {
//                         maxNumber = Math.max(maxNumber, num);
//                     }
//                 }
//             });
//         });

//         // New refId = prefix + (maxNumber + 1)
//         let prefix = unitObj?.unitName.substring(0, 3).toUpperCase();
//         if (prefix.length < 3) {
//             prefix = prefix.padEnd(3, "A"); // e.g., "TV" -> "TVA"
//         }
//         const refId = `${prefix}-${maxNumber + 1}`;

//         // Add new subItem
//         unitObj.subItems.push({
//             subItemName: subItemName?.trim(),
//             refId,
//             quantity,
//             unit
//         });


//         // Add new subItem
//         // unitObj.subItems.push({ subItemName: subItemName?.trim(), refId, quantity, unit });

//         await orderDoc.save();

//         await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

//         res.json({ ok: true, message: "SubItem added", subItems: unitObj.subItems });

//         updateInventoryRemainingQuantity({ itemName: subItemName, orderedQuantity: quantity })
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



// export const updateSubItemInUnit = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, unitId, subItemId } = req.params;
//         const { subItemName, quantity, unit } = req.body;
//         // console.log("subitem name", subItemName)
//         if (!projectId ||
//             !unitId ||
//             !subItemId) {
//             return res.status(400).json({ ok: false, message: "Invalid IDs" });
//         }

//         if (!subItemName?.trim()) {
//             return res.status(400).json({ message: "material name is requried", ok: false })
//         }

//         const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
//         if (!orderDoc) {
//             return res.status(404).json({ ok: false, message: "Order history not found" });
//         }

//         const unitObj = (orderDoc.selectedUnits as any).id(unitId);
//         if (!unitObj) {
//             return res.status(404).json({ ok: false, message: "Unit not found" });
//         }

//         const subItemObj = unitObj.subItems.id(subItemId);
//         if (!subItemObj) {
//             return res.status(404).json({ ok: false, message: "SubItem not found" });
//         }


//         // const isExists = unitObj.subItems.find((unit: OrderSubItems) => {
//         //     console.log("unit", unit.subItemName)
//         //     return unit?.subItemName?.toLowerCase() === subItemName?.toLowerCase()
//         // })


//         // if (isExists) {
//         //     return res.status(400).json({ message: "item already exists", ok: false })
//         // }


//         // ---- INVENTORY UPDATE PART ----
//         // Track old quantity before updating
//         const oldQuantity = subItemObj.quantity || 0;


//         subItemObj.subItemName = subItemName.trim();
//         if (quantity !== null) subItemObj.quantity = quantity;
//         if (!unit !== undefined) subItemObj.unit = unit;

//         await orderDoc.save();

//         await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

//         res.status(200).json({ ok: true, message: "SubItem updated", subItem: subItemObj });

//         // ---- INVENTORY UPDATE PART (background) ----
//         if (quantity !== null && quantity !== oldQuantity) {
//             const diff = quantity - oldQuantity;

//             (async () => {
//                 try {
//                     if (diff > 0) {
//                         await updateInventoryRemainingQuantity({
//                             itemName: subItemName.trim(),
//                             orderedQuantity: diff,
//                         });
//                     } else if (diff < 0) {
//                         await InventoryModel.updateOne(
//                             { "subItems.itemName": subItemName.trim() },
//                             { $inc: { "subItems.$.remainingQuantity": Math.abs(diff) } }
//                         ).exec();
//                         console.log(
//                             `Inventory restored: Item "${subItemName}" increased by ${Math.abs(diff)}`
//                         );
//                     }
//                 } catch (err) {
//                     console.error("Background inventory update failed:", err);
//                 }
//             })();
//         }
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



// export const deleteSubItemFromUnit = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, unitId, subItemId } = req.params;

//         if (!projectId ||
//             !unitId ||
//             !subItemId) {
//             return res.status(400).json({ ok: false, message: "Invalid IDs" });
//         }

//         const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
//         if (!orderDoc) {
//             return res.status(404).json({ ok: false, message: "Order history not found" });
//         }

//         const unitObj = (orderDoc.selectedUnits as any).id(unitId);
//         if (!unitObj) {
//             return res.status(404).json({ ok: false, message: "Unit not found" });
//         }

//         const subItemObj = unitObj.subItems.id(subItemId);
//         if (!subItemObj) {
//             return res.status(404).json({ ok: false, message: "SubItem not found" });
//         }

//         const { subItemName, quantity } = subItemObj;


//         unitObj.subItems.pull({ _id: subItemId });
//         await orderDoc.save();

//         await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


//         res.json({ ok: true, message: "SubItem deleted", subItems: unitObj.subItems });


//         // ---- BACKGROUND INVENTORY UPDATE ----
//         (async () => {
//             try {
//                 // add back deleted quantity to inventory
//                 await InventoryModel.updateOne(
//                     { "subItems.itemName": subItemName.trim() },
//                     { $inc: { "subItems.$.remainingQuantity": quantity } }
//                 ).exec();

//                 console.log(`Inventory restored: "${subItemName}" increased by ${quantity}`);
//             } catch (err) {
//                 console.error("Inventory update failed (deleteSubItemFromUnit):", err);
//             }
//         })();
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



// export const deleteAllSubUnits = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;

//         if (!projectId) {
//             return res.status(400).json({ ok: false, message: "Invalid Project ID" });
//         }

//         const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
//         if (!orderDoc) {
//             return res.status(404).json({ ok: false, message: "Order history not found" });
//         }

//         // orderDoc.selectedUnits.forEach(unit => {
//         //     unit.subItems = [];
//         // });

//         // await orderDoc.save();


//         // 🧮 Step 1: Collect all subItems to restore quantities
//         const allSubItemsToRestore: { subItemName: string; quantity: number }[] = [];

//         orderDoc.selectedUnits.forEach(unit => {
//             unit.subItems.forEach(sub => {
//                 if (sub.subItemName && sub.quantity > 0) {
//                     allSubItemsToRestore.push({
//                         subItemName: sub.subItemName,
//                         quantity: sub.quantity,
//                     });
//                 }
//             });

//             // Then clear subItems
//             unit.subItems = [];
//         });

//         // 🛠️ Restore subItem quantities before saving


//         await orderDoc.save();

//         await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


//         res.json({ ok: true, message: "All SubItem deleted", data: orderDoc.selectedUnits });


//         // 🔁 Fire-and-forget to restore inventory without blocking response
//         setImmediate(async () => {
//             try {
//                 await restoreInventoryQuantities({
//                     projectId,
//                     subItems: allSubItemsToRestore,
//                 });
//             } catch (err: any) {
//                 console.error("❌ Failed to restore inventory after deleteAllSubUnits:", err.message);
//             }
//         })

//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };


// end old vrsion of updatig he items


export const updateDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        // if (!siteName || !address || !siteSupervisor || !phoneNumber) {
        //     return res.status(400).json({ ok: false, message: "All delivery location details are required." });
        // }


        if (phoneNumber?.trim() && phoneNumber.length !== 10) {
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
            { projectId },

            {
                $set: {
                    deliveryLocationDetails: { siteName, address, siteSupervisor, phoneNumber },
                },
            },
            { new: true, upsert: true }
        );

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to update delivery details." });
        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })


        res.status(200).json({ ok: true, message: "Delivery location updated", data: orderingDoc.deliveryLocationDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe delivery details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};




export const updateShopDetails = async (req: Request, res: Response): Promise<any> => {
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
                    shopDetails: { shopName, address, contactPerson, phoneNumber },
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





export const uploadOrderMaterialImages = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded.", ok: false });
        }

        const mappedFiles: IFileItem[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                _id: new mongoose.Types.ObjectId(),
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });



        const orderingDoc = await OrderMaterialHistoryModel.findOneAndUpdate({ projectId }, {
            $push: { images: { $each: mappedFiles } }
        }, { new: true });

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to upload the images." });
        }

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })

        res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.images || [] });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



export const deleteOrderingMaterialImage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, imageId } = req.params;

        // 1. Find the pdf record in DB
        // const orderDoc = await OrderMaterialHistoryModel.findOne({
        //   projectId,
        //   generatedLink:{
        //     $pull: {_id: pdfId}
        //   }
        // });

        const orderDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
            { projectId },
            { $pull: { images: { _id: imageId } } },
            { returnDocument: "after" }
        );

        if (!orderDoc) {
            return res.status(404).json({ message: "image not found", ok: false });
        }

        // 2. Delete from S3
        // const pdfKey = pdfRecord.fileKey; // store s3 key in db when uploading
        // if (pdfKey) {
        //   await s3
        //     .deleteObject({
        //       Bucket: process.env.AWS_S3_BUCKET!,
        //       Key: pdfKey,
        //     })
        //     .promise();
        // }


        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.status(200).json({
            message: "PDF deleted successfully",
            data: orderDoc?.images || [],
            ok: true
        });
    } catch (err) {
        console.error("Error deleting PDF:", err);
        return res.status(500).json({ message: "Failed to delete PDF", error: err, ok: false });
    }
};




export const getOrderHistoryMaterial = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // await redisClient.del(redisMainKey)
        const cachedData = await redisClient.get(redisMainKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }

        const doc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })


        return res.status(200).json({ ok: true, data: doc });

    }
    catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}




// COMMON STAGE CONTROLLERS

export const setOrderMaterialHistoryStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: OrderMaterialHistoryModel,
        stageName: "Ordering History"
    });
};



export const orderMaterialHistoryCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await OrderMaterialHistoryModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            await syncMaterialArrivalNew(projectId)
            // await autoCreateCostEstimationRooms(req, res, projectId)
            // await syncMaterialArrival(projectId)


            // NEED TO MAKE THE CHANGES
            // let uploadedFiles: DocUpload[] = form.uploads?.map((file: any) => ({
            //   type: file.type,
            //   url: file.url,
            //   originalName: file.originalName,
            // })) || []




            // await addOrUpdateStageDocumentation({
            //   projectId,
            //   stageNumber: "8", // ✅ Put correct stage number here
            //   description: "Ordering Material Stage is documented",
            //   uploadedFiles, // optionally add files here
            // })


        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`

        // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: form })


        res.status(200).json({ ok: true, message: "order material stage marked as completed", data: form });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};



//  NEWER VERSION




export const addSubItemToUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { subItemName, quantity, unit } = req.body;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid projectId" });
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

        // Find the unit inside selectedUnits by _id
        // const unitObj = (orderDoc.currentOrder as any).id(unitId);
        // if (!unitObj) {
        //     return res.status(404).json({ ok: false, message: "Unit not found in order history" });
        // }



        const isExists = orderDoc.currentOrder.subItems.find((unit: OrderSubItems) => {
            console.log("unit", unit.subItemName)
            return unit?.subItemName?.toLowerCase()?.trim() === subItemName?.toLowerCase()?.trim()
        })


        if (isExists) {
            return res.status(400).json({ message: "Material item already exists with the same name", ok: false })
        }

        // 🔹 Find max number used across ALL units' subItems
        let maxNumber = 0;
        orderDoc.currentOrder.subItems.forEach((sub: OrderSubItems) => {
            if (sub.refId) {
                const num = parseInt(sub.refId.replace(/^\D+/, ""), 10); // remove prefix, take number
                if (!isNaN(num)) {
                    maxNumber = Math.max(maxNumber, num);
                }
            }
        });

        // New refId = prefix + (maxNumber + 1)
        let prefix = "MAT"
        const refId = `${prefix}-${maxNumber + 1}`;

        // Add new subItem
        orderDoc.currentOrder.subItems.push({
            subItemName: subItemName?.trim(),
            refId,
            quantity,
            unit
        });


        // Add new subItem
        // unitObj.subItems.push({ subItemName: subItemName?.trim(), refId, quantity, unit });

        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        res.json({ ok: true, message: "SubItem added", subItems: orderDoc.currentOrder.subItems });

        updateInventoryRemainingQuantity({ itemName: subItemName, orderedQuantity: quantity })
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateSubItemInUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, subItemId } = req.params;
        const { subItemName, quantity, unit } = req.body;
        // console.log("subitem name", subItemName)
        if (!projectId ||
           
            !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        if (!subItemName?.trim()) {
            return res.status(400).json({ message: "material name is requried", ok: false })
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        const subItemObj = (orderDoc.currentOrder.subItems as any).id(subItemId);
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



export const deleteSubItemFromUnitNew = async (req: Request, res: Response): Promise<any> => {
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

        // const unitObj = (orderDoc.selectedUnits as any).id(unitId);
        // if (!unitObj) {
        //     return res.status(404).json({ ok: false, message: "Unit not found" });
        // }

        const subItemObj = (orderDoc.currentOrder.subItems as any).id(subItemId);
        if (!subItemObj) {
            return res.status(404).json({ ok: false, message: "SubItem not found" });
        }

        const { subItemName, quantity } = subItemObj;


        (orderDoc.currentOrder.subItems as any).pull({ _id: subItemId });
        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        res.json({ ok: true, message: "SubItem deleted", subItems: orderDoc.currentOrder.subItems });


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



export const deleteAllSubUnitsNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid Project ID" });
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        // orderDoc.selectedUnits.forEach(unit => {
        //     unit.subItems = [];
        // });

        // await orderDoc.save();


        // 🧮 Step 1: Collect all subItems to restore quantities
        const allSubItemsToRestore: { subItemName: string; quantity: number }[] = [];

        orderDoc.currentOrder.subItems.forEach(sub => {
                if (sub.subItemName && sub.quantity > 0) {
                    allSubItemsToRestore.push({
                        subItemName: sub.subItemName,
                        quantity: sub.quantity,
                    });
                }
            // Then clear subItems
        });
        
        orderDoc.currentOrder.subItems = [];
        // 🛠️ Restore subItem quantities before saving


        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        res.json({ ok: true, message: "All SubItem deleted", data: orderDoc.currentOrder.subItems });


        // 🔁 Fire-and-forget to restore inventory without blocking response
        setImmediate(async () => {
            try {
                await restoreInventoryQuantities({
                    projectId,
                    subItems: allSubItemsToRestore,
                });
            } catch (err: any) {
                console.error("❌ Failed to restore inventory after deleteAllSubUnits:", err.message);
            }
        })

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



//  END OF NEWER VERSION





// WHATSAPP LINK API

// export const generateOrderingMaterialLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;

//         const form = await OrderMaterialHistoryModel.findOne({ projectId })

//         if (!form) return res.status(404).json({ ok: false, message: "Ordering Material Form not found" });

//         if (form.generatedLink) {
//             return res.status(400).json({ ok: false, message: "Link already generated" });
//         }

//         const token = generateOrderingToken();

//         form.generatedLink = `${process.env.FRONTEND_URL}/ordermaterial/public/${projectId}/${token}`;
//         await form.save();

//         return res.status(200).json({
//             ok: true,
//             message: "Link generated successfully",
//             data: {
//                 token,
//                 shareableUrl: form.generatedLink,
//             },
//         });
//     }
//     catch (error) {
//         return res.status(500).json({ ok: false, message: "server error" });
//     }
// };



// Controller function




export const submitOrderMaterial = async (req: Request, res: Response): Promise<any> => {
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


        // const filteredUnits = orderDoc.selectedUnits.filter(unit =>
        //     Array.isArray(unit?.subItems) && unit?.subItems?.length > 0
        // );



        const isSafe = orderDoc?.currentOrder?.subItems && orderDoc.currentOrder?.subItems?.length > 0




        // if (filteredUnits?.length === 0) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: "No valid units found. Each selected unit must have at least one sub-item."
        //     });
        // }


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


        // const orderNumber = orderDoc?.currentOrder.orderMaterialNumber;


        const newOrderEntry = {
            subItems: orderDoc?.currentOrder?.subItems,   // <-- ONLY FILTERED UNITS ARE ADDED
            shopDetails: orderDoc.shopDetails,
            deliveryLocationDetails: orderDoc.deliveryLocationDetails,
            images: orderDoc.images,
            pdfLink: null,
            orderMaterialNumber: orderNumber,
            createdAt: new Date(),
            isSyncWithProcurement: false,
            isPublicOrder: false
        };


        if (orderDoc?.orderedItems && Array.from(orderDoc.orderedItems) && orderDoc.orderedItems.length > 0) {
            orderDoc.orderedItems.push(newOrderEntry)
        } else {
            orderDoc.orderedItems = [newOrderEntry]
        }


        // orderDoc.selectedUnits.forEach(unit => {
        //     unit.subItems = [];
        // });




        // let nextNumber = 1;
        // const isNewPdf = Array.isArray(orderDoc.orderedItems) && orderDoc.orderedItems.length > 0;

        // if (isNewPdf) {
        //     // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
        //     const numbers = orderDoc.orderedItems.map(ele => {
        //         const match = ele.orderMaterialNumber?.match(/-(\d+)$/);
        //         return match ? parseInt(match[1], 10) : 0; // Extract the number part
        //     });

        //     // Find the max number and increment
        //     nextNumber = Math.max(...numbers, 0) + 1;
        // }


        // const currentYear = new Date().getFullYear()


        // // Always 3-digit format
        // const paddedNumber = String(nextNumber).padStart(3, "0");
        // const rawProjectId = (orderDoc.projectId as any)._id.toString().slice(-3);



        nextNumber = nextNumber + 1
        const nextPadNumber = String(nextNumber).padStart(3, "0");

        const newOrderMaterialNumber = `ORD-${rawProjectId}-${currentYear}-${nextPadNumber}`;

        orderDoc.currentOrder.orderMaterialNumber = newOrderMaterialNumber
        orderDoc.currentOrder.subItems = [];
        orderDoc.images = [];

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




export const getSingleOrderedItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, orderItemId } = req.params;

        // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {

        //     cachedData.orderedItems
        //     return res.status(200).json({ message: "data fetched from the cache for single order item", data: JSON.parse(cachedData), ok: true })
        // }

        const doc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });


        const orderItem = doc.orderedItems.find((order: any) => order._id.toString() === orderItemId.toString())

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })


        return res.status(200).json({ ok: true, data: orderItem, message: "fetched single order item" });


    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }

}


export const placeOrderToProcurement = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, orderItemId, organizationId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }

        if (!orderItemId) {
            return res.status(400).json({
                ok: false,
                message: 'OrderItemId is required'
            });
        }

        if (!organizationId) {
            return res.status(400).json({
                ok: false,
                message: 'organizationId is required'
            });
        }


        // const result = await generateOrderHistoryPDF(projectId, organizationId);

        const orderDoc = await OrderMaterialHistoryModel.findOne(
            { projectId }
        );

        if (!orderDoc) {
            return res.status(404).json({ message: "Order Material not found", ok: false });
        }

        let orderItem = orderDoc.orderedItems.find((order: any) => order._id.toString() === orderItemId.toString())

        if (!orderItem) {
            return res.status(404).json({ message: "Order Item not available", ok: false });
        }


        if (orderItem?.isSyncWithProcurement) {
            return res.status(404).json({ message: "Order Item is already sent to procurement", ok: false });
        }




        const ProcurementNewItems: any[] = [];
        const subItemMap: Record<string, any> = {}; // key = subItemName

        // orderItem.selectedUnits.forEach(unit => {

        //     unit.subItems.forEach((subItem: any) => {
        //         const { _id, refId, ...rest } = subItem.toObject ? subItem.toObject() : subItem;

        //         const name = rest.subItemName?.trim().toLowerCase() || "";
        //         const unitKey = rest.unit?.trim().toLowerCase() || "";
        //         const key = `${name}__${unitKey}`; // combine name + unit

        //         if (key) {
        //             if (subItemMap[key]) {
        //                 // Already exists with same name+unit → add quantity
        //                 subItemMap[key].quantity += rest.quantity || 0;
        //             } else {
        //                 // Create fresh entry
        //                 subItemMap[key] = {
        //                     ...rest,
        //                     quantity: rest.quantity || 0,
        //                     _id: new mongoose.Types.ObjectId() // always refresh ID
        //                 };
        //             }
        //         }
        //     });
        // });

 orderItem.subItems.forEach((subItem:any) => {
                const { _id, refId, ...rest } = subItem.toObject ? subItem.toObject() : subItem;

                const name = rest.subItemName?.trim().toLowerCase() || "";
                const unitKey = rest.unit?.trim().toLowerCase() || "";
                const key = `${name}__${unitKey}`; // combine name + unit

                if (key) {
                    if (subItemMap[key]) {
                        // Already exists with same name+unit → add quantity
                        subItemMap[key].quantity += rest.quantity || 0;
                    } else {
                        // Create fresh entry
                        subItemMap[key] = {
                            ...rest,
                            quantity: rest.quantity || 0,
                            _id: new mongoose.Types.ObjectId() // always refresh ID
                        };
                    }
                }
        });



        // Convert map back to array
        Object.values(subItemMap).forEach((item: any) => ProcurementNewItems.push(item));

        // console.log("procurement", ProcurementNewItems)
        await ProcurementModelNew.create({
            organizationId,
            projectId: projectId,
            shopDetails: orderItem.shopDetails,
            deliveryLocationDetails: orderItem.deliveryLocationDetails,
            selectedUnits: ProcurementNewItems,
            refPdfId: orderItemId,
            isSyncWithPaymentsSection: false,
            isConfirmedRate: false,

            fromDeptNumber: orderItem?.orderMaterialNumber,
            fromDeptName: "Order Material",
            fromDeptModel: "OrderMaterialHistoryModel",
            fromDeptRefId: orderDoc._id as Types.ObjectId,
            totalCost: 0
        });

        await syncAccountingRecord({
            organizationId: organizationId! || null,
            projectId: orderDoc?.projectId || null,

            // Reference Links
            referenceId: null,
            referenceModel: null, // Must match Schema
            deptRecordFrom: null,

            deptGeneratedDate: null,
            deptNumber: null,
            deptDueDate: null,

            // Categorization

            orderMaterialDeptNumber: orderItem?.orderMaterialNumber,
            orderMaterialRefId: (orderDoc as any)._id,

            // Person Details
            assoicatedPersonName: "",
            assoicatedPersonId: null,
            assoicatedPersonModel: null, // Assuming this is your Vendor Model

            // Financials
            amount: 0, // Utility takes care of grandTotal logic if passed
            notes: "",

            // Defaults for Creation
            status: "pending",
            paymentId: null
        });

        // Clear subItems from each selectedUnit

        if (orderItem) {
            orderItem.isSyncWithProcurement = true;
        }

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
}



// Controller function
export const generateOrderHistoryPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, organizationId, orderItemId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }

        if (!orderItemId) {
            return res.status(400).json({
                ok: false,
                message: 'OrderItemId is required'
            });
        }

        const result = await generateOrderHistoryPDF(projectId, organizationId, orderItemId);

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: result?.data?.orderHistory })


        res.status(200).json(result);

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};



//  NOT IN USE
// DELETE PDF API 
export const deleteOrderMaterialPdf = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, pdfId } = req.params;

        // 1. Find the pdf record in DB
        // const orderDoc = await OrderMaterialHistoryModel.findOne({
        //   projectId,
        //   generatedLink:{
        //     $pull: {_id: pdfId}
        //   }
        // });

        const orderDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
            { projectId },
            { $pull: { generatedLink: { _id: pdfId } } },
            { returnDocument: "after" }
        );

        if (!orderDoc) {
            return res.status(404).json({ message: "PDF not found", ok: false });
        }

        // 2. Delete from S3
        // const pdfKey = pdfRecord.fileKey; // store s3 key in db when uploading
        // if (pdfKey) {
        //   await s3
        //     .deleteObject({
        //       Bucket: process.env.AWS_S3_BUCKET!,
        //       Key: pdfKey,
        //     })
        //     .promise();
        // }


        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.status(200).json({
            message: "PDF deleted successfully",
            data: pdfId,
            ok: true
        });
    } catch (err) {
        console.error("Error deleting PDF:", err);
        return res.status(500).json({ message: "Failed to delete PDF", error: err, ok: false });
    }
};


//  NOT IN USE
export const updatePdfStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, pdfId } = req.params; // order history and pdf doc inside generatedLink
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ ok: false, message: "Status is required" });
        }


        // validate allowed statuses
        const allowedStatuses = [
            "pending",
            "ordered",
            "shipped",
            "delivered",
            "cancelled",
            "yet to order"
        ];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ ok: false, message: "Invalid status value" });
        }

        // update only the status field of the matching pdfGeneratorSchema
        const updatedDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
            { projectId, "generatedLink._id": pdfId },
            { $set: { "generatedLink.$.status": status } },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({ ok: false, message: "Order history or PDF not found" });
        }


        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: updatedDoc })


        return res.status(200).json({
            ok: true,
            message: "Status updated successfully",
            data: updatedDoc,
        });
    } catch (error: any) {
        console.error("Error updating PDF status:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};


//  NOT IN USE
export const getPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        // const stageSelection = await getStageSelectionUtil(projectId);
        // const mode = stageSelection?.mode || "Manual Flow";



        // if (mode === "Modular Units") {


        // const modularUnits = await SelectedModularUnitModel.findOne({ projectId });
        // const externalUnits = await SelectedExternalModel.findOne({ projectId });

        // let finalData: any = []


        // if (modularUnits && modularUnits.selectedUnits) {
        //     let units = modularUnits.selectedUnits

        //     let onlyUnits = units.map(ele => {
        //         return {
        //             "unitName": "N/A",
        //             "image": ele?.image,
        //             "customId": ele?.customId,
        //             "category": ele?.category,
        //             "quantity": ele?.quantity,
        //             "height": 0,
        //             "width": 0,
        //             "depth": 0
        //         }
        //     })


        //     finalData = finalData.concat(onlyUnits)
        // }


        // if (externalUnits && externalUnits.selectedUnits) {

        //     let units = externalUnits.selectedUnits

        //     let onlyUnits = units.map(ele => {
        //         return {
        //             "unitName": ele.unitName,
        //             "image": ele?.image || "No Image",
        //             "customId": ele.unitCode,
        //             "category": ele?.category,
        //             "quantity": ele?.quantity,
        //             "height": ele.dimention?.height ?? "N/A",
        //             "width": ele.dimention?.width ?? "N/A",
        //             "depth": ele.dimention?.depth ?? "N/A",
        //         }
        //     })

        //     finalData = finalData.concat(onlyUnits)
        // }

        // return res.status(200).json({ message: "got the data", data: finalData, ok: true })


        let existing = await OrderMaterialHistoryModel.findOne({ projectId });

        if (!existing) {
            return res.status(200).json({ message: "got the data", data: [], ok: true })
        }
        return res.status(200).json({ message: "got the data", data: existing, ok: true })
        // }
        // else if (mode === "Manual Flow") {
        //     let existing = await OrderMaterialHistoryModel.findOne({ projectId });

        //     if (!existing) {
        //         return res.status(200).json({ message: "got the data", data: [], ok: true })
        //     }
        //     return res.status(200).json({ message: "got the data", data: existing, ok: true })
        // }
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });

    }
}