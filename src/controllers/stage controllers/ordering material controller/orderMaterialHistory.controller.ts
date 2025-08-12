import { Request, Response } from "express";
import redisClient from "../../../config/redisClient";
import { SelectedModularUnitModel } from "../../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
import { IOrderHistorytimer, OrderMaterialHistoryModel } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
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

        if (isExternalExists && isExternalExists?.selectedUnits?.length) {
            let selectedUnits = isExternalExists.selectedUnits

            const findSingleQuantityPrice = (height: number, width: number, depth: number, unitPrice: number) => {
                const h = Number(height);
                const w = Number(width);
                const d = Number(depth);

                const heightFt = h / 304.8;
                const widthFt = w / 304.8;
                const depthFt = d / 304.8;

                const cubicFeet = heightFt * widthFt * depthFt;
                // console.log("cal cubic feet", cubicFeet)
                // const price = cubicFeet * unitPrice * quantity;
                // console.log("cal price before ceilt", price)
                // return Math.floor(price); // No decimals, always rounded up


                const pricePerUnit = Math.ceil(cubicFeet * unitPrice); // ⬅️ round per unit
                return pricePerUnit

            }
            // console.log("Geetting inside of selected Units in the external block")

            for (let unit of selectedUnits) {
                // const { _id, ...res } = (unit as any).toObject()
                const { unitCode, unitName, price, category, dimention, quantity, image } = unit
                const { height = 0, width = 0, depth = 0 } = dimention as any || {}

                const singleUnitCost = findSingleQuantityPrice(height, width, depth, price)

                let externalUnits: any = {
                    customId: unitCode,
                    name: unitName,
                    category: category,
                    singleUnitCost: singleUnitCost,
                    quantity: quantity,
                    unitId: (unit as any)._id,
                    image: image?.url
                }

                selected.push(externalUnits)
                // console.log("selected Units in the external block", selected)
            }
            totalCost += isExternalExists?.totalCost || 0
        }
        if (units) {
            totalCost += units.totalCost || 0;
            const modularUnits = units.selectedUnits.map((doc: any) => {
                const { _id, ...rest } = doc.toObject();
                return { ...rest };
            });

            selected = selected.concat(modularUnits);
        }
    } else if (mode === "Manual Flow") {
        const [materials, estimation] = await Promise.all([
            MaterialRoomConfirmationModel.findOne({ projectId }),
            CostEstimationModel.findOne({ projectId }),
        ]);

        const materialMap = new Map<string, number>(); // key → quantity

        // collect quantities from roomFields
        materials?.rooms?.forEach(room => {
            const roomFields = room.roomFields || {};
            for (const key in roomFields) {
                const entry = roomFields[key] as IRoomItemEntry;
                const qty = entry?.quantity || 0;
                materialMap.set(key, (materialMap.get(key) || 0) + qty);
            }
        });


        estimation?.materialEstimation?.forEach(room => {
            room.materials?.forEach(item => {
                // Skip if no finalRate (i.e., not estimated)
                if (typeof item.finalRate !== "number") return;

                // Skip if no matching material in the confirmation
                const quantity = materialMap.get(item.key);
                if (!quantity) return;

                const unit = {
                    category: item.key,
                    quantity,
                    singleUnitCost: item.finalRate,
                    unitId: null,
                    customId: item.key,
                    image: null,
                };

                selected.push(unit);
                totalCost += item.finalRate * quantity;
            });
        });
    }

    // Build timer
    const timer: IOrderHistorytimer = {
        startedAt: new Date(),
        completedAt: null,
        deadLine:  new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
    };

    if (!existing) {
        existing = new OrderMaterialHistoryModel({
            projectId,
            status: "pending",
            isEditable: true,
            assignedTo: null,
            timer,
            selectedUnits: selected,
            totalCost,
        });
    } else {
        existing.timer = timer;
        existing.totalCost += totalCost;

        selected.forEach((newUnit: any) => {
            const existingUnit = existing?.selectedUnits?.find(
                (unit: any) => unit.customId === newUnit.customId
            );

            if (existingUnit) {
                // ✅ Only update quantity if the new unit is modular
                if (newUnit.customId.toLowerCase().includes("modular")) {
                    existingUnit.quantity += newUnit.quantity || 0;
                } else {
                    existing?.selectedUnits.push(newUnit);
                }
            } else {
                // ✅ If not found, push new unit
                existing?.selectedUnits.push(newUnit);
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

export const generateOrderingMaterialLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const form = await OrderMaterialHistoryModel.findOne({ projectId })

        if (!form) return res.status(404).json({ ok: false, message: "Ordering Material Form not found" });

        if (form.generatedLink) {
            return res.status(400).json({ ok: false, message: "Link already generated" });
        }

        const token = generateOrderingToken();

        form.generatedLink = `${process.env.FRONTEND_URL}/ordermaterial/public/${projectId}/${token}`;
        await form.save();

        return res.status(200).json({
            ok: true,
            message: "Link generated successfully",
            data: {
                token,
                shareableUrl: form.generatedLink,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ ok: false, message: "server error" });
    }
};



export const getPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const modularUnits = await SelectedModularUnitModel.findOne({ projectId });
        const externalUnits = await SelectedExternalModel.findOne({ projectId });

        let finalData: any = []


        if (modularUnits && modularUnits.selectedUnits) {
            let units = modularUnits.selectedUnits

            let onlyUnits = units.map(ele => {
                return {
                    "unitName": "N/A",
                    "image": ele?.image,
                    "customId": ele?.customId,
                    "category": ele?.category,
                    "quantity": ele?.quantity,
                    "height": 0,
                    "width": 0,
                    "depth": 0
                }
            })


            finalData = finalData.concat(onlyUnits)
        }


        if (externalUnits && externalUnits.selectedUnits) {

            let units = externalUnits.selectedUnits

            let onlyUnits = units.map(ele => {
                return {
                    "unitName": ele.unitName,
                    "image": ele?.image || "No Image",
                    "customId": ele.unitCode,
                    "category": ele?.category,
                    "quantity": ele?.quantity,
                    "height": ele.dimention?.height ?? "N/A",
                    "width": ele.dimention?.width ?? "N/A",
                    "depth": ele.dimention?.depth ?? "N/A",
                }
            })

            finalData = finalData.concat(onlyUnits)
        }

        return res.status(200).json({ message: "got the data", data: finalData, ok: true })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });

    }
}