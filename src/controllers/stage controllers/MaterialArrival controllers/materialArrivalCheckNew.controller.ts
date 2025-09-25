import { Request, Response } from "express";
import MaterialArrivalModel, { IMaterialArrival, MaterialArrivalSingle } from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
import { DocUpload, RoleBasedRequest } from "../../../types/types";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { syncWorkSchedule } from "../workTasksmain controllers/workMain.controller";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { generateOrderingToken } from "../../../utils/generateToken";
import { Types } from "mongoose"
// import { getStageSelectionUtil } from "../../Modular Units Controllers/StageSelection Controller/stageSelection.controller";
import { IRoomItemEntry } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes";
import { OrderMaterialHistoryModel, OrderSubItems } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";



// export const syncMaterialArrivalNew = async (projectId: string | Types.ObjectId) => {
//     const materialArrival = await MaterialArrivalModel.findOne({ projectId })
//     const selected = await SelectedModularUnitModel.findOne({ projectId });

//     if (!selected) {
//         console.log("selected units not created")
//         // return;
//     }


//     console.log("selete units", selected)

//     const timer = {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: null,
//         reminderSent: false,
//     };
//     // Prepare new items with default structure

//     let newItems:any[] = []
//     if (selected?.selectedUnits?.length) {
//         newItems = selected.selectedUnits.map((unit: any) => ({
//             customId: unit.customId,
//             quantity: 0,
//             image: null,
//             isVerified: false,
//         }));

//     }

//     if (!materialArrival) {
//         // ⬇️ Create new document if not exists
//         await MaterialArrivalModel.create({
//             projectId,
//             status: "pending",
//             isEditable: true,
//             assignedTo: null,
//             materialArrivalList: newItems,
//             timer,
//             generatedLink: null,
//         });
//     } else {
//         // ⬇️ Append only new items by filtering duplicates (by customId)
//         const existingIds = new Set(
//             (materialArrival.materialArrivalList as any || []).map((item: any) => item.customId)
//         );

//         const uniqueNewItems = newItems.filter(item => !existingIds.has(item.customId));

//         if (uniqueNewItems.length > 0) {
//             (materialArrival.materialArrivalList as any).push(...uniqueNewItems);
//             await materialArrival.save();
//         }
//     }

// }



export const syncMaterialArrivalNew = async (projectId: string) => {
    const timer: any = {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false,
    };

    // const stageSelection = await getStageSelectionUtil(projectId);
    // const mode = stageSelection?.mode || "Manual Flow";

   
    // if (mode === "Modular Units") {


    //     const materialArrival = await MaterialArrivalModel.findOne({ projectId });
    //     const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId });

    //     let newItems: any[] = [];

    //     if (orderHistory?.selectedUnits?.length) {
    //         newItems = orderHistory.selectedUnits.flatMap((unit: any) =>
    //             unit.subItems.map((subItem: OrderSubItems) => ({
    //                 unitName: subItem.subItemName?.trim(),
    //                 quantity: 0,          // will be updated by site staff
    //                 image: null,          // staff will upload
    //                 isVerified: false,    // verification pending
    //             }))
    //         );
    //     }


    //     if (!materialArrival) {
    //         await MaterialArrivalModel.create({
    //             projectId,
    //             status: "pending",
    //             isEditable: true,
    //             assignedTo: null,
    //             materialArrivalList: newItems,
    //             timer,
    //             generatedLink: null,
    //         });
    //     } else {
    //         // 🔍 Preserve already verified items
    //         const existingList = materialArrival?.materialArrivalList || [];
    //         const existingMap = new Map(
    //             (existingList as any)?.map((item: any) => [item.unitName?.trim(), item])
    //         );

    //         const finalItemsToAdd: any[] = [];

    //         for (const item of newItems) {
    //             if (existingMap.has(item.unitName)) {
    //                 const existingItem: any = existingMap.get(item.unitName?.trim());
    //                 if (existingItem.isVerified) {
    //                     // Preserve entire object if already verified
    //                     continue;
    //                 }
    //             } else {
    //                 finalItemsToAdd.push(item);
    //             }
    //         }

    //         if (finalItemsToAdd.length > 0) {
    //             (materialArrival?.materialArrivalList as any)?.push(...finalItemsToAdd);

    //             materialArrival.timer = timer
    //             await materialArrival.save();
    //         }
    //     }
    // }
    // else if (mode === "Manual Flow") {
        const materialArrival = await MaterialArrivalModel.findOne({ projectId });
        const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId });

        let newItems: any[] = [];

        if (orderHistory?.selectedUnits?.length) {
            newItems = orderHistory.selectedUnits.flatMap((unit: any) =>
                unit.subItems.map((subItem: OrderSubItems) => ({
                    unitName: subItem.subItemName?.trim(),
                    quantity: 0,          // will be updated by site staff
                    image: null,          // staff will upload
                    isVerified: false,    // verification pending
                }))
            );
        }


        if (!materialArrival) {
            await MaterialArrivalModel.create({
                projectId,
                status: "pending",
                isEditable: true,
                assignedTo: null,
                materialArrivalList: newItems,
                timer,
                generatedLink: null,
            });
        } else {
            // 🔍 Preserve already verified items
            const existingList = materialArrival?.materialArrivalList || [];
            const existingMap = new Map(
                (existingList as any)?.map((item: any) => [item.unitName?.trim(), item])
            );

            const finalItemsToAdd: any[] = [];

            for (const item of newItems) {
                if (existingMap.has(item.unitName)) {
                    const existingItem: any = existingMap.get(item.unitName?.trim());
                    if (existingItem.isVerified) {
                        // Preserve entire object if already verified
                        continue;
                    }
                } else {
                    finalItemsToAdd.push(item);
                }
            }

            if (finalItemsToAdd.length > 0) {
                (materialArrival?.materialArrivalList as any)?.push(...finalItemsToAdd);
                materialArrival.timer = timer
                await materialArrival.save();
            }
        }
    // }

    const redisMainkey = `stage:MaterialArrivalModel:${projectId}`
    await redisClient.del(redisMainkey)

   
};



export const updateMaterialArrivalItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, fieldId } = req.params;
        const { quantity } = req.body;
        const file = req.file as Express.Multer.File & { location: string };

        if (!projectId || !fieldId) {
            return res.status(400).json({ ok: false, message: "projectId and _id are required" });
        }

        const doc: any = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Project not found" });
        }

        const index = doc.materialArrivalList.findIndex(
            (item: any) => String(item._id) === fieldId
        );

        if (index === -1) {
            return res.status(404).json({ ok: false, message: "Material item not found" });
        }
        // Update the image if uploaded
        if (file) {
            doc.materialArrivalList[index].image = {
                type: "image",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            };
        }

        // Always update quantity if provided
        if (quantity !== undefined) {
            doc.materialArrivalList[index].quantity = quantity;
        }


        // console.log("file is working", doc.materialArrivalList[index])

        await doc.save();

        await populateWithAssignedToField({
            stageModel: MaterialArrivalModel,
            projectId,
            dataToCache: doc,
        });

        return res.status(200).json({
            ok: true,
            message: "Material arrival item updated",
            data: doc.materialArrivalList[index],
        });
    } catch (err: any) {
        console.error("Error updating material arrival item:", err);
        return res.status(500).json({
            ok: false,
            message: err.message || "Server error",
        });
    }
};




export const toggleMaterialVerification = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, unitName } = req.params;
        const { isVerified } = req.body;

        const doc: any = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ message: "Project not found", ok: false });
        console.log("unitName", unitName)
        const item = doc.materialArrivalList.find((mat: any) => mat.unitName === unitName);
        if (!item) return res.status(404).json({ message: "Material not found", ok: false });

        item.isVerified = isVerified;
        await doc.save();

        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        return res.status(200).json({ message: "Verification status updated", ok: true });
    } catch (err) {
        console.error("Toggle verification error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};


export const bulkToggleAllVerification = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { isVerified } = req.body;

        const doc: any = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ message: "Project not found", ok: false });

        doc.materialArrivalList = doc.materialArrivalList.map((mat: any) => ({
            ...mat.toObject(),
            isVerified
        }));

        await doc.save();


        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        return res.status(200).json({ message: `All materials marked as ${isVerified ? "verified" : "not verified"}`, ok: true });
    } catch (err) {
        console.error("Bulk verify error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};



export const getAllMaterialArrivalDetails = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;


        const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
        await redisClient.del(redisMainKey);

        const cachedData = await redisClient.get(redisMainKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });

        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        if (!doc) return res.status(404).json({ message: "No material arrival record found", ok: false });

        return res.status(200).json({ ok: true, data: doc });
    } catch (err) {
        console.error("Fetch error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};




export const generateMaterialArrivalLink = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Material Arrival document not found" });

        if (doc.generatedLink) {
            return res.status(400).json({ ok: false, message: "Link already generated" });
        }

        const token = generateOrderingToken(); // or use your custom function like generateMaterialArrivalToken()
        doc.generatedLink = `${process.env.FRONTEND_URL}/materialarrival/public/${projectId}/${token}`;
        await doc.save();


        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        return res.status(200).json({
            ok: true,
            message: "Link generated successfully",
            data: {
                token,
                shareableUrl: doc.generatedLink,
            }
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

export const getMaterialArrivalPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const doc = await MaterialArrivalModel.findOne({ projectId });

        if (!doc) return res.status(404).json({ ok: false, message: "Invalid or expired link" });

        const { materialArrivalList } = doc;
        res.json({ ok: true, data: { materialArrivalList } });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};







// COMMON STAGE CONTROLLERS

const setMaterialArrivalStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: MaterialArrivalModel,
        stageName: "Material Arrival"
    });
};



const materialArrivalCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await MaterialArrivalModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            // await syncInstallationWork(projectId)
            

            // let uploadedFiles: DocUpload[] = [];

            // const categories = Object.keys(form.materialArrivalList || {});

            // for (const category of categories) {
            //     const items = (form.materialArrivalList as any)[category] || [];

            //     items.forEach((item: any) => {
            //         if (item.upload && item.upload.url) {
            //             uploadedFiles.push({
            //                 type: item.upload.type,
            //                 url: item.upload.url,
            //                 originalName: item.upload.originalName,
            //             });
            //         }
            //     });
            // }


            // await addOrUpdateStageDocumentation({
            //     projectId,
            //     stageNumber: "9", // Material Arrival stage number
            //     description: "Material Arrival Stage is documented",
            //     uploadedFiles,
            // });

        }
        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}}`
        // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })


        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: form })

        res.status(200).json({ ok: true, message: "mateiral arrival stage marked as completed", data: form.status });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


export {
    setMaterialArrivalStageDeadline,
    materialArrivalCompletionStatus
};
