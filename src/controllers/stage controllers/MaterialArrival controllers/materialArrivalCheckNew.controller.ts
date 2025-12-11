import { Request, Response } from "express";
import MaterialArrivalModel, { IMaterialArrival, IMaterialOrdered, IUploadFile, MaterialArrivalSingle } from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
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
import { IOrderedItems, OrderMaterialHistoryModel, OrderSubItems } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";

// export const syncMaterialArrivalNew = async (projectId: string) => {
//     const timer: any = {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//         reminderSent: false,
//     };

//     // const stageSelection = await getStageSelectionUtil(projectId);
//     // const mode = stageSelection?.mode || "Manual Flow";


//     // if (mode === "Modular Units") {


//     //     const materialArrival = await MaterialArrivalModel.findOne({ projectId });
//     //     const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId });

//     //     let newItems: any[] = [];

//     //     if (orderHistory?.selectedUnits?.length) {
//     //         newItems = orderHistory.selectedUnits.flatMap((unit: any) =>
//     //             unit.subItems.map((subItem: OrderSubItems) => ({
//     //                 unitName: subItem.subItemName?.trim(),
//     //                 quantity: 0,          // will be updated by site staff
//     //                 image: null,          // staff will upload
//     //                 isVerified: false,    // verification pending
//     //             }))
//     //         );
//     //     }


//     //     if (!materialArrival) {
//     //         await MaterialArrivalModel.create({
//     //             projectId,
//     //             status: "pending",
//     //             isEditable: true,
//     //             assignedTo: null,
//     //             materialArrivalList: newItems,
//     //             timer,
//     //             generatedLink: null,
//     //         });
//     //     } else {
//     //         // 🔍 Preserve already verified items
//     //         const existingList = materialArrival?.materialArrivalList || [];
//     //         const existingMap = new Map(
//     //             (existingList as any)?.map((item: any) => [item.unitName?.trim(), item])
//     //         );

//     //         const finalItemsToAdd: any[] = [];

//     //         for (const item of newItems) {
//     //             if (existingMap.has(item.unitName)) {
//     //                 const existingItem: any = existingMap.get(item.unitName?.trim());
//     //                 if (existingItem.isVerified) {
//     //                     // Preserve entire object if already verified
//     //                     continue;
//     //                 }
//     //             } else {
//     //                 finalItemsToAdd.push(item);
//     //             }
//     //         }

//     //         if (finalItemsToAdd.length > 0) {
//     //             (materialArrival?.materialArrivalList as any)?.push(...finalItemsToAdd);

//     //             materialArrival.timer = timer
//     //             await materialArrival.save();
//     //         }
//     //     }
//     // }
//     // else if (mode === "Manual Flow") {
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
//     // }

//     const redisMainkey = `stage:MaterialArrivalModel:${projectId}`
//     await redisClient.del(redisMainkey)


// };

// --- Helper Function to Generate Unique Number ---

const generateMaterialArrivalNumber = (projectId: string, sequence: number) => {
    // 1. Get last 3 digits of Project ID (handle short IDs safely)
    const projectSuffix = projectId.length >= 3
        ? projectId.slice(-3)
        : projectId;

    // 2. Get Year
    const year = new Date().getFullYear();

    // 3. Pad sequence with zeros (e.g., 5 -> "005")
    const sequenceStr = String(sequence).padStart(3, '0');

    return `MAT-ARV-${projectSuffix}-${year}-${sequenceStr}`;
};


const getSequenceFromId = (id: string | null): number => {
    if (!id) return 0;
    try {
        // ID format: MAT-ARV-123-2024-005
        const parts = id.split('-');
        const lastPart = parts[parts.length - 1];
        const number = parseInt(lastPart, 10);
        return isNaN(number) ? 0 : number;
    } catch (e) {
        return 0;
    }
};



export const syncMaterialArrivalNew = async (projectId: string) => {
    try {
        // Default Timer Config
        const timer: any = {
            startedAt: new Date(),
            completedAt: null,
            deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days deadline
            reminderSent: false,
        };

        // 1. Fetch Source (Order History) & Destination (Material Arrival)
        const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId });
        const materialArrival = await MaterialArrivalModel.findOne({ projectId });

        // If no orders exist, we can't sync anything.
        if (!orderHistory || !orderHistory.orderedItems || orderHistory.orderedItems.length === 0) {

            if (!materialArrival) {
                await MaterialArrivalModel.create({
                    projectId,
                    status: "pending",
                    isEditable: true,
                    assignedTo: null,
                    materialArrivalList: [], // Insert all transformed orders
                    timer,
                    generatedLink: null,
                });
            }
            return;
        }

        // 2. Transform Source Data into Destination Format
        // We map each "Order" (which contains multiple units/subItems) into the Material Arrival Schema structure
        const incomingOrders = orderHistory.orderedItems.map((order: IOrderedItems) => {

            // Flatten: selectedUnits[] -> subItems[]
            // const flattenedSubItems = order.selectedUnits.flatMap((unit) =>
            const flattenedSubItems = order.subItems.map((subItem) =>(
                // (unit.subItems || []).map((subItem) => ({
                    {subItemName: subItem.subItemName?.trim(),
                    refId: subItem.refId,
                    orderedQuantity: subItem.quantity, // Map quantity from Order to orderedQuantity
                    unit: subItem.unit,
                    arrivedQuantity: 0,
                    images: [],       // Empty initially, site staff uploads here
                    isVerified: false // Default false
                // }))
        }
            )

            );

            return {
                orderMaterialDeptNumber: order.orderMaterialNumber,
                procurementDeptNumber: null, // Can be filled if linked later
                paymentDeptNumber: null,
                logisticsDeptNumber: null,
                orderedImages: order?.images || [],
                subItems: flattenedSubItems
            };
        });

        // 3. Sync Logic
        if (!materialArrival) {
            // --- CASE A: Create New Document ---

            // Start counter at 0
            let currentSequence = 0;

            const ordersWithIds = incomingOrders.map((order) => {
                currentSequence++; // Increment for every item
                return {
                    ...order,
                    materialArrivalDeptNumber: generateMaterialArrivalNumber(projectId, currentSequence)
                };
            });


            await MaterialArrivalModel.create({
                projectId,
                status: "pending",
                isEditable: true,
                assignedTo: null,
                materialArrivalList: ordersWithIds, // Insert all transformed orders
                timer,
                generatedLink: null,
            });
            console.log(`Material Arrival created for project: ${projectId}`);

        } else {
            // CASE B: Update Existing Document (Smart Merge)
            const existingArrivalList = materialArrival.materialArrivalList || [];

            // 1. Find the highest Sequence Number currently in the DB
            let maxSequence = 0;
            existingArrivalList.forEach((item: IMaterialOrdered) => {
                const seq = getSequenceFromId(item.materialArrivalDeptNumber);
                if (seq > maxSequence) {
                    maxSequence = seq;
                }
            });

            // We iterate through incoming orders to merge them into existing list
            for (const newOrder of incomingOrders) {

                // Find if this specific Order Number already exists in Material Arrival
                const existingOrderIndex = existingArrivalList.findIndex(
                    (x) => x.orderMaterialDeptNumber === newOrder.orderMaterialDeptNumber
                );

                if (existingOrderIndex === -1) {

                    maxSequence++; // Increment global counter
                    const newId = generateMaterialArrivalNumber(projectId, maxSequence);

                    const orderToAdd = {
                        ...newOrder,
                        materialArrivalDeptNumber: newId // Assign new unique ID
                    };


                    // Sub-Case B1: New Order found -> Push it entirey
                    materialArrival.materialArrivalList.push(orderToAdd as any);
                } else {
                    // Sub-Case B2: Order exists -> Merge subItems carefully
                    const existingOrder = existingArrivalList[existingOrderIndex];

                    // Fallback: If existing item somehow lacks an ID (legacy data), fix it now
                    if (!existingOrder.materialArrivalDeptNumber) {
                        maxSequence++;
                        existingOrder.materialArrivalDeptNumber = generateMaterialArrivalNumber(projectId, maxSequence);
                    }

                    // Create a Map of existing subItems for fast lookup (Key: refId or Name)
                    // We prefer refId for uniqueness, fallback to name
                    const existingSubMap = new Map();
                    existingOrder.subItems.forEach((item: any) => {
                        const key = item.refId || item.subItemName?.trim();
                        if (key) existingSubMap.set(key, item);
                    });

                    // Construct the merged subItems list
                    const mergedSubItems = newOrder.subItems.map((newItem: any) => {
                        const key = newItem.refId || newItem.subItemName?.trim();
                        const existingItem = existingSubMap.get(key);

                        if (existingItem) {
                            // If item exists, we preserve critical fields (images, verification status)
                            return {
                                ...newItem, // Update basic details (like name/unit)
                                orderedQuantity: newItem.orderedQuantity, // Sync quantity if changed
                                arrivedQuantity: existingItem.arrivedQuantity,
                                images: existingItem.images.length > 0 ? existingItem.images : [], // Preserve images
                                isVerified: existingItem.isVerified // Preserve status
                            };
                        } else {
                            // New sub-item added to the order later
                            return newItem;
                        }
                    });

                    // Update the subItems for this order
                    materialArrival.materialArrivalList[existingOrderIndex].subItems = mergedSubItems;
                    // Update the ordered images for the main order header as well (Source of truth is Order Dept)

                    materialArrival.materialArrivalList[existingOrderIndex].orderedImages = (newOrder as any).orderedImages;

                }
            }

            // Save updates
            await materialArrival.save();
            console.log(`Material Arrival synced for project: ${projectId}`);
        }

        // 4. Clear Cache
        const redisMainkey = `stage:MaterialArrivalModel:${projectId}`;
        await redisClient.del(redisMainkey);

    } catch (error) {
        console.error("Error syncing Material Arrival:", error);
        // We don't throw here to avoid breaking the calling flow (e.g., PDF generation flow), 
        // but you can throw if you want strict consistency.
    }
};



// export const updateMaterialArrivalItem = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, fieldId } = req.params;
//         const { quantity } = req.body;
//         const file = req.file as Express.Multer.File & { location: string };



//         if (!projectId || !fieldId) {
//             return res.status(400).json({ ok: false, message: "projectId and _id are required" });
//         }

//         const doc: any = await MaterialArrivalModel.findOne({ projectId });
//         if (!doc) {
//             return res.status(404).json({ ok: false, message: "Project not found" });
//         }


//         const index = doc.materialArrivalList.findIndex(
//             (item: any) => String(item._id) === fieldId
//         );

//         if (index === -1) {
//             return res.status(404).json({ ok: false, message: "Material item not found" });
//         }
//         // Update the image if uploaded
//         if (file) {
//             doc.materialArrivalList[index].image = {
//                 type: "image",
//                 url: file.location,
//                 originalName: file.originalname,
//                 uploadedAt: new Date(),
//             };
//         }

//         // Always update quantity if provided
//         if (quantity !== undefined) {
//             doc.materialArrivalList[index].quantity = quantity;
//         }


//         // console.log("file is working", doc.materialArrivalList[index])

//         await doc.save();

//         await populateWithAssignedToField({
//             stageModel: MaterialArrivalModel,
//             projectId,
//             dataToCache: doc,
//         });

//         return res.status(200).json({
//             ok: true,
//             message: "Material arrival item updated",
//             data: doc.materialArrivalList[index],
//         });
//     } catch (err: any) {
//         console.error("Error updating material arrival item:", err);
//         return res.status(500).json({
//             ok: false,
//             message: err.message || "Server error",
//         });
//     }
// };




// export const toggleMaterialVerification = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { projectId, unitName } = req.params;
//         const { isVerified } = req.body;

//         const doc: any = await MaterialArrivalModel.findOne({ projectId });
//         if (!doc) return res.status(404).json({ message: "Project not found", ok: false });
//         console.log("unitName", unitName)
//         const item = doc.materialArrivalList.find((mat: any) => mat.unitName === unitName);
//         if (!item) return res.status(404).json({ message: "Material not found", ok: false });

//         item.isVerified = isVerified;
//         await doc.save();

//         await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


//         return res.status(200).json({ message: "Verification status updated", ok: true });
//     } catch (err) {
//         console.error("Toggle verification error:", err);
//         return res.status(500).json({ message: "Internal server error", ok: false });
//     }
// };


// public
export const updateMaterialArrivalItem = async (req: Request, res: Response): Promise<any> => {
    try {
        // We need orderNumber to find the group, and subItemId to find the specific item
        const { projectId, orderNumber, subItemId } = req.params;
        const { arrivedQuantity } = req.body;

        // Handle Files
        const files = req.file as (Express.Multer.File & { location: string });

        if (!projectId || !orderNumber || !subItemId) {
            return res.status(400).json({ ok: false, message: "projectId, orderNumber, and subItemId are required" });
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Project not found in Material Arrival" });
        }

        // 1. Find the specific Order Group
        const orderGroup = doc.materialArrivalList.find(
            (order: any) => order.orderMaterialDeptNumber === orderNumber
        );

        if (!orderGroup) {
            return res.status(404).json({ ok: false, message: "Order Number not found in this project" });
        }

        // 2. Find the specific Sub-Item within that Order
        // Note: We cast to 'any' or check _id.toString()
        const subItem = orderGroup.subItems.find(
            (item: any) => String(item._id) === subItemId
        );

        if (!subItem) {
            return res.status(404).json({ ok: false, message: "Sub-item not found" });
        }

        // --- UPDATE LOGIC ---

        // 3. Update Arrived Quantity
        if (arrivedQuantity !== undefined && arrivedQuantity !== null) {
            subItem.arrivedQuantity = Number(arrivedQuantity);
        }


        console.log("req.files", files)

        // 4. Append New Images (if uploaded)
        if (files) {
            // const mappedFiles: IUploadFile[] = files.map(file => {
            //     const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            //     return {
            //         type,
            //         url: file.location,
            //         originalName: file.originalname,
            //         uploadedAt: new Date()
            //     };
            // });


            const mappedFiles: IUploadFile = {
                type: "image",
                url: files.location,
                originalName: files.originalname,
                uploadedAt: new Date(),
            };


            console.log("mappedfiles", mappedFiles)
            // Push new files into existing array
            subItem.images = [mappedFiles];
        }




        // 5. Save Changes
        await doc.save();

        // 6. Cache Invalidation
        const redisMainkey = `stage:MaterialArrivalModel:${projectId}`;
        await redisClient.del(redisMainkey);

        return res.status(200).json({
            ok: true,
            message: "Item updated successfully",
            data: subItem,
        });

    } catch (err: any) {
        console.error("Error updating material arrival item:", err);
        return res.status(500).json({
            ok: false,
            message: err.message || "Server error",
        });
    }
};



export const updateStaffMaterialArrivalQuantity = async (req: Request, res: Response): Promise<any> => {
    try {
        // We need orderNumber to find the group, and subItemId to find the specific item
        const { projectId, orderNumber, subItemId } = req.params;
        const { arrivedQuantity } = req.body;

    
        if (!projectId || !orderNumber || !subItemId) {
            return res.status(400).json({ ok: false, message: "projectId, orderNumber, and subItemId are required" });
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Project not found in Material Arrival" });
        }

        // 1. Find the specific Order Group
        const orderGroup = doc.materialArrivalList.find(
            (order: any) => order.orderMaterialDeptNumber === orderNumber
        );

        if (!orderGroup) {
            return res.status(404).json({ ok: false, message: "Order Number not found in this project" });
        }

        // 2. Find the specific Sub-Item within that Order
        // Note: We cast to 'any' or check _id.toString()
        const subItem = orderGroup.subItems.find(
            (item: any) => String(item._id) === subItemId
        );

        if (!subItem) {
            return res.status(404).json({ ok: false, message: "Sub-item not found" });
        }

        // --- UPDATE LOGIC ---

        // 3. Update Arrived Quantity
        if (arrivedQuantity !== undefined && arrivedQuantity !== null) {
            subItem.arrivedQuantity = Number(arrivedQuantity);
        }

        // 5. Save Changes
        await doc.save();

        // 6. Cache Invalidation
        const redisMainkey = `stage:MaterialArrivalModel:${projectId}`;
        await redisClient.del(redisMainkey);

        return res.status(200).json({
            ok: true,
            message: "Item updated successfully",
            data: subItem,
        });

    } catch (err: any) {
        console.error("Error updating material arrival item:", err);
        return res.status(500).json({
            ok: false,
            message: err.message || "Server error",
        });
    }
};




export const updateMaterialArrivalImage = async (req: Request, res: Response): Promise<any> => {
    try {
        // We need orderNumber to find the group, and subItemId to find the specific item
        const { projectId, orderNumber, subItemId } = req.params;

        // Handle Files
        const files = req.file as (Express.Multer.File & { location: string });

        if (!projectId || !orderNumber || !subItemId) {
            return res.status(400).json({ ok: false, message: "projectId, orderNumber, and subItemId are required" });
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Project not found in Material Arrival" });
        }

        // 1. Find the specific Order Group
        const orderGroup = doc.materialArrivalList.find(
            (order: any) => order.orderMaterialDeptNumber === orderNumber
        );

        if (!orderGroup) {
            return res.status(404).json({ ok: false, message: "Order Number not found in this project" });
        }

        // 2. Find the specific Sub-Item within that Order
        // Note: We cast to 'any' or check _id.toString()
        const subItem = orderGroup.subItems.find(
            (item: any) => String(item._id) === subItemId
        );

        if (!subItem) {
            return res.status(404).json({ ok: false, message: "Sub-item not found" });
        }

        console.log("req.files", files)

        // 4. Append New Images (if uploaded)
        if (files) {
            // const mappedFiles: IUploadFile[] = files.map(file => {
            //     const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            //     return {
            //         type,
            //         url: file.location,
            //         originalName: file.originalname,
            //         uploadedAt: new Date()
            //     };
            // });


            const mappedFiles: IUploadFile = {
                type: "image",
                url: files.location,
                originalName: files.originalname,
                uploadedAt: new Date(),
            };


            console.log("mappedfiles", mappedFiles)
            // Push new files into existing array
            subItem.images = [mappedFiles];
        }




        // 5. Save Changes
        await doc.save();

        // 6. Cache Invalidation
        const redisMainkey = `stage:MaterialArrivalModel:${projectId}`;
        await redisClient.del(redisMainkey);

        return res.status(200).json({
            ok: true,
            message: "Item updated successfully",
            data: subItem,
        });

    } catch (err: any) {
        console.error("Error updating material arrival item:", err);
        return res.status(500).json({
            ok: false,
            message: err.message || "Server error",
        });
    }
};


export const toggleMaterialVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        // We use subItemId for precision instead of unitName (names can be duplicates)
        const { projectId, orderNumber, subItemId } = req.params;
        const { isVerified } = req.body;

        if (typeof isVerified !== 'boolean') {
            return res.status(400).json({ ok: false, message: "isVerified must be a boolean" });
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ message: "Project not found", ok: false });

        // 1. Find Order Group
        const orderGroup = doc.materialArrivalList.find(
            (order: any) => order.orderMaterialDeptNumber === orderNumber
        );

        if (!orderGroup) {
            return res.status(404).json({ ok: false, message: "Order Number not found" });
        }

        // 2. Find Sub-Item
        const subItem = orderGroup.subItems.find(
            (item: any) => String(item._id) === subItemId
        );

        if (!subItem) {
            return res.status(404).json({ message: "Material Item not found", ok: false });
        }

        // 3. Update Status
        subItem.isVerified = isVerified;

        // 4. Save
        await doc.save();

        // 5. Clear Cache
        const redisMainkey = `stage:MaterialArrivalModel:${projectId}`;
        await redisClient.del(redisMainkey);

        return res.status(200).json({
            message: `Verification status updated to ${isVerified}`,
            ok: true,
            data: { subItemId, isVerified }
        });

    } catch (err: any) {
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
        if (!doc) return res.status(404).json({ message: "No material arrival record found", ok: false });


        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        if (!doc) return res.status(404).json({ message: "No Material Arrival Found", ok: false });

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
