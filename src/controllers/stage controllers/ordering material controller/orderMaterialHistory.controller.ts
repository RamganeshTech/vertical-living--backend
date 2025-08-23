import { Request, Response } from "express";
import mongoose from "mongoose"
import redisClient from "../../../config/redisClient";
import { SelectedModularUnitModel } from "../../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
import { IOrderHistorytimer, OrderMaterialHistoryModel, OrderSubItems } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { syncMaterialArrivalNew } from "../MaterialArrival controllers/materialArrivalCheckNew.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { getStageSelectionUtil } from "../../Modular Units Controllers/StageSelection Controller/stageSelection.controller";
import { IRoomItemEntry } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes";
import { SelectedExternalModel } from './../../../models/externalUnit model/SelectedExternalUnit model/selectedExternalUnit.model';
import { RoleBasedRequest } from "../../../types/types";
import { generateOrderingToken } from "../../../utils/generateToken";
import { generateOrderHistoryPDF } from "./pdfOrderHistory.controller";

// export const syncOrderingMaterialsHistory = async (projectId: string) => {

//     let existing = await OrderMaterialHistoryModel.findOne({ projectId });

//     const Units = await SelectedModularUnitModel.findOne({ projectId })



//     let totalCost;
//     let selected: any[];
//     if (!Units) {
//         totalCost = 0
//         selected = []
//     } else {
//         totalCost = Units.totalCost
//         selected = Units.selectedUnits.map((doc: any) => {
//             const { _id, ...rest } = doc.toObject(); // ✅ remove _id and convert to plain object
//             return { ...rest };
//         });
//     }
//     const timer: IOrderHistorytimer = {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: null,
//         reminderSent: false,
//     };




//     if (!existing) {
//         existing = new OrderMaterialHistoryModel({
//             projectId: projectId,
//             status: "pending",
//             isEditable: true,
//             assignedTo: null,
//             timer,
//             selectedUnits: selected,
//             totalCost,
//         });
//     }
//     else {
//         existing.timer = timer
//         existing.totalCost += totalCost
//         selected.forEach((newUnit: any) => {
//             const existingUnit = existing?.selectedUnits?.find(
//                 (unit: any) => unit.customId === newUnit.customId
//             );

//             if (existingUnit) {
//                 // ✅ If exists, increase quantity
//                 existingUnit.quantity += newUnit.quantity || 0;
//             } else {
//                 // ✅ If not exists, push new (with new _id auto-generated)
//                 existing?.selectedUnits.push(newUnit);
//             }
//         });
//     }
//     await existing.save()
//     await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: existing })

// }



export const syncOrderingMaterialsHistory = async (projectId: string) => {
    let existing = await OrderMaterialHistoryModel.findOne({ projectId });

    // Fetch the stage selection mode
    const stageSelection = await getStageSelectionUtil(projectId);
    const mode = stageSelection?.mode || "Manual Flow";

    let selected: any[] = [];
    let totalCost = 0;

    if (mode === "Modular Units") {
        const units = await SelectedModularUnitModel.findOne({ projectId });

        const isExternalExists = await SelectedExternalModel.findOne({ projectId })

        // external units condition
        if (isExternalExists && isExternalExists?.selectedUnits?.length) {
            let selectedUnits = isExternalExists.selectedUnits

            // const findSingleQuantityPrice = (height: number, width: number, depth: number, unitPrice: number) => {
            //     const h = Number(height);
            //     const w = Number(width);
            //     const d = Number(depth);

            //     const heightFt = h / 304.8;
            //     const widthFt = w / 304.8;
            //     const depthFt = d / 304.8;

            //     const cubicFeet = heightFt * widthFt * depthFt;
            //     // console.log("cal cubic feet", cubicFeet)
            //     // const price = cubicFeet * unitPrice * quantity;
            //     // console.log("cal price before ceilt", price)
            //     // return Math.floor(price); // No decimals, always rounded up


            //     const pricePerUnit = Math.ceil(cubicFeet * unitPrice); // ⬅️ round per unit
            //     return pricePerUnit

            // }
            // console.log("Geetting inside of selected Units in the external block")

            for (let unit of selectedUnits) {
                // const { _id, ...res } = (unit as any).toObject()
                const { unitCode, unitName, price, category, dimention, quantity, image, totalPrice } = unit
                const { height = 0, width = 0, depth = 0 } = dimention as any || {}

                // const singleUnitCost = findSingleQuantityPrice(height, width, depth, price)

                let externalUnits: any = {
                    customId: unitCode,
                    // name: unitName,
                    unitName,
                    category: category,
                    singleUnitCost: totalPrice,
                    quantity: quantity,
                    dimention,
                    unitId: (unit as any)._id,
                    image: image?.url,
                    subItems: []
                }

                selected.push(externalUnits)
                // console.log("selected Units in the external block", selected)
            }
            totalCost = isExternalExists?.totalCost || 0
        }


        // moudlar units condiiton
        if (units) {
            totalCost += units.totalCost || 0;
            const modularUnits = units.selectedUnits.map((doc: any) => {
                const { _id, ...rest } = doc.toObject();
                return { ...rest, dimention: null };
            });

            selected = selected.concat(modularUnits);
        }


    } else if (mode === "Manual Flow") {
        // const [materials, estimation] = await Promise.all([
        //     MaterialRoomConfirmationModel.findOne({ projectId }),
        //     CostEstimationModel.findOne({ projectId }),
        // ]);

        // const materialMap = new Map<string, number>(); // key → quantity

        // // collect quantities from roomFields
        // materials?.rooms?.forEach(room => {
        //     const roomFields = room.roomFields || {};
        //     for (const key in roomFields) {
        //         const entry = roomFields[key] as IRoomItemEntry;
        //         const qty = entry?.quantity || 0;
        //         materialMap.set(key, (materialMap.get(key) || 0) + qty);
        //     }
        // });


        // estimation?.materialEstimation?.forEach(room => {
        //     room.materials?.forEach(item => {
        //         // Skip if no finalRate (i.e., not estimated)
        //         if (typeof item.finalRate !== "number") return;

        //         // Skip if no matching material in the confirmation
        //         const quantity = materialMap.get(item.key);
        //         if (!quantity) return;

        //         const unit = {
        //             category: item.key,
        //             quantity,
        //             singleUnitCost: item.finalRate,
        //             unitId: null,
        //             customId: item.key,
        //             image: null,
        //         };

        //         selected.push(unit);
        //         totalCost += item.finalRate * quantity;
        //     });
        // });

        const materialRoomData = await MaterialRoomConfirmationModel.findOne({ projectId }).lean();
        if (!materialRoomData) {
            console.log("mteiral room stage not found")
            return
        }
        const rooms = materialRoomData.rooms || [];

        // 2. Get cost estimation data
        const costEstimationData = await CostEstimationModel.findOne({ projectId }).lean();
        if (!costEstimationData) {
            console.log("cost estimation stage not found")
            return
        }

        const materialEstimationRooms = costEstimationData.materialEstimation || [];

        // 3. Build cost lookup map by room name and key
        const costMap: Record<string, Record<string, number>> = {};
        materialEstimationRooms.forEach(room => {
            costMap[room.name] = {};
            (room.materials || []).forEach(material => {
                costMap[room.name][material.key] = material.totalCost || 0;
            });
        });

        // 4. Build selectedUnits array for OrderMaterialHistory


        rooms.forEach(room => {
            // let materialsCostMap: any;
            // if (Array.isArray(room.roomFields)) {
            //     room.roomFields.forEach(ele => {
            //         materialsCostMap = costMap?.[room.name]?.[ele.itemName] ?? {};
            //     });
            // }
            ((room.roomFields as any) || []).forEach((item: any) => {
                const unitName = item.itemName;    /// room name 
                const quantity = item.quantity || 0;
                const unitCost = costMap?.[room.name]?.[item.itemName] || 0;

                if (quantity <= 0) return; // skip zero quantity

                selected.push({
                    unitId: null, // If you can resolve unitId from somewhere, set here
                    category: unitName, // Set category if you have it, else null
                    image: null, // Set image if you have it, else null
                    customId: null, // Set customId if available
                    unitName,
                    dimention: null,
                    quantity,
                    singleUnitCost: unitCost,
                    subItems: [],
                });
            });
        });

        // 5. Calculate total cost
        totalCost = selected.reduce(
            (acc, item) => acc + item.quantity * item.singleUnitCost,
            0
        );

        // 6. Upsert OrderMaterialHistoryModel document
        // const orderHistoryDoc = await OrderMaterialHistoryModel.findOneAndUpdate(
        //     { projectId },
        //     {
        //         projectId,
        //         selectedUnits:selected,
        //         totalCost,
        //         status: "pending",
        //         isEditable: true,
        //         timer: {
        //             startedAt: null,
        //             completedAt: null,
        //             deadLine: null,
        //             reminderSent: false,
        //         },
        //         assignedTo: null,
        //         generatedLink: "",
        //     },
        //     { new: true }
        // );

    }

    // Build timer
    const timer: IOrderHistorytimer = {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
    };

    if (!existing) {
        const commonOrders = {
            customId: null,
            // name: unitName,
            unitName: "Common Orders",
            category: null,
            singleUnitCost: 0,
            quantity: 0,
            dimention: null,
            unitId: null,
            image: null,
            subItems: []
        }
        selected.push(commonOrders)
        existing = new OrderMaterialHistoryModel({
            projectId,
            status: "pending",
            isEditable: true,
            assignedTo: null,
            timer,
            selectedUnits: selected,
            totalCost,
            genreatedLink: []
        });
    } else {
        // existing.timer = timer;
        // existing.totalCost += totalCost;

        // selected.forEach((newUnit: any) => {
        //     const existingUnit = existing?.selectedUnits?.find(
        //         (unit: any) => unit.customId === newUnit.customId
        //     );

        //     if (existingUnit) {
        //         // ✅ Only update quantity if the new unit is modular
        //         if (newUnit.customId.toLowerCase().includes("modular")) {
        //             existingUnit.quantity += newUnit.quantity || 0;
        //         } else {
        //             existing?.selectedUnits.push(newUnit);
        //         }
        //     } else {
        //         // ✅ If not found, push new unit
        //         existing?.selectedUnits.push(newUnit);
        //     }
        // });

        existing.timer = timer;
        existing.totalCost = totalCost;

        selected.forEach((newUnit: any) => {
            const existingUnit = existing?.selectedUnits?.find(
                (unit: any) => unit.unitName === newUnit.unitName
            );

            if (!existingUnit) {
                // ✅ Only update quantity if the new unit is modular
                existing?.selectedUnits.push(newUnit);
            } else {
                // Exists — update quantity only if changed
                if (existingUnit.quantity !== newUnit.quantity) {
                    existingUnit.quantity = newUnit.quantity;
                    // Optional: update cost if it might have changed

                    // // Also update other fields if you want:
                    // existingUnit.category = newUnit.category;
                    // existingUnit.image = newUnit.image;
                    // existingUnit.customId = newUnit.customId;
                    // existingUnit.subItems = newUnit.subItems || [];
                }

                if (existingUnit.singleUnitCost !== newUnit.singleUnitCost) {
                    existingUnit.singleUnitCost = newUnit.singleUnitCost;
                }

            }
        });
    }

    await existing.save();
    await populateWithAssignedToField({
        stageModel: OrderMaterialHistoryModel,
        projectId,
        dataToCache: existing,
    });
};



// const manualInsertCustomOrders = async (projectId:string)=>{
//      const commonOrders = {
//             customId: null,
//             // name: unitName,
//             unitName: "Common Orders",
//             category: null,
//             singleUnitCost: 0,
//             quantity: 1,
//             dimention: null,
//             unitId: new mongoose.Types.ObjectId(),
//             image: null,
//             subItems: []
//         }
//         console.log("getin ented")
//       const orders =  await OrderMaterialHistoryModel.findOne({projectId})

//       orders?.selectedUnits.push(commonOrders as any)
//         if(orders){

//             await orders.save()
//         }
// }

export const addSubItemToUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, unitId } = req.params;
        const { subItemName, quantity, unit } = req.body;

        if (!projectId || !unitId) {
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

        // Find the unit inside selectedUnits by _id
        const unitObj = (orderDoc.selectedUnits as any).id(unitId);
        if (!unitObj) {
            return res.status(404).json({ ok: false, message: "Unit not found in order history" });
        }



        const isExists = unitObj.subItems.find((unit: OrderSubItems) => {
            console.log("unit", unit.subItemName)
            return unit?.subItemName?.toLowerCase()?.trim() === subItemName?.toLowerCase()?.trim()
        })


        if (isExists) {
            return res.status(400).json({ message: "Material item already exists with the same name", ok: false })
        }

        // 🔹 Find max number used across ALL units' subItems
        let maxNumber = 0;
        orderDoc.selectedUnits.forEach((u: any) => {
            u.subItems.forEach((sub: any) => {
                if (sub.refId) {
                    const num = parseInt(sub.refId.replace(/^\D+/, ""), 10); // remove prefix, take number
                    if (!isNaN(num)) {
                        maxNumber = Math.max(maxNumber, num);
                    }
                }
            });
        });

        // New refId = prefix + (maxNumber + 1)
        let prefix = unitObj?.unitName.substring(0, 3).toUpperCase();
        if (prefix.length < 3) {
            prefix = prefix.padEnd(3, "A"); // e.g., "TV" -> "TVA"
        }
        const refId = `${prefix}-${maxNumber + 1}`;

        // Add new subItem
        unitObj.subItems.push({
            subItemName: subItemName?.trim(),
            refId,
            quantity,
            unit
        });


        // Add new subItem
        // unitObj.subItems.push({ subItemName: subItemName?.trim(), refId, quantity, unit });

        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        return res.json({ ok: true, message: "SubItem added", subItems: unitObj.subItems });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateSubItemInUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, unitId, subItemId } = req.params;
        const { subItemName, quantity, unit } = req.body;
        // console.log("subitem name", subItemName)
        if (!projectId ||
            !unitId ||
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

        const unitObj = (orderDoc.selectedUnits as any).id(unitId);
        if (!unitObj) {
            return res.status(404).json({ ok: false, message: "Unit not found" });
        }

        const subItemObj = unitObj.subItems.id(subItemId);
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

        subItemObj.subItemName = subItemName.trim();
        if (quantity !== null) subItemObj.quantity = quantity;
        if (!unit !== undefined) subItemObj.unit = unit;

        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        return res.json({ ok: true, message: "SubItem updated", subItem: subItemObj });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteSubItemFromUnit = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, unitId, subItemId } = req.params;

        if (!projectId ||
            !unitId ||
            !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        const orderDoc = await OrderMaterialHistoryModel.findOne({ projectId });
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Order history not found" });
        }

        const unitObj = (orderDoc.selectedUnits as any).id(unitId);
        if (!unitObj) {
            return res.status(404).json({ ok: false, message: "Unit not found" });
        }

        const subItemObj = unitObj.subItems.id(subItemId);
        if (!subItemObj) {
            return res.status(404).json({ ok: false, message: "SubItem not found" });
        }

        unitObj.subItems.pull({ _id: subItemId });
        await orderDoc.save();

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.json({ ok: true, message: "SubItem deleted", subItems: unitObj.subItems });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        if (!siteName || !address || !siteSupervisor || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All delivery location details are required." });
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



        if (!shopName || !address || !contactPerson || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All shop details are required." });
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
export const generateOrderHistoryPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }

        const result = await generateOrderHistoryPDF(projectId);

        await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: result.data })


        res.status(200).json(result);

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};



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

export const getPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const stageSelection = await getStageSelectionUtil(projectId);
        const mode = stageSelection?.mode || "Manual Flow";



        if (mode === "Modular Units") {


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
        }
        else if (mode === "Manual Flow") {
            let existing = await OrderMaterialHistoryModel.findOne({ projectId });

            if (!existing) {
                return res.status(200).json({ message: "got the data", data: [], ok: true })
            }
            return res.status(200).json({ message: "got the data", data: existing, ok: true })
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });

    }
}


