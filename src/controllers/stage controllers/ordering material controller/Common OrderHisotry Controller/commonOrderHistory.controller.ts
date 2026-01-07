// controllers/orderHistory/createProjectOrder.ts

import { Request, Response } from 'express';
import { IOrderHistorytimer, IPdfGenerator, OrderSubItems } from '../../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { RoleBasedRequest } from '../../../../types/types';
import { CommonOrderHistoryModel } from './../../../../models/Stage Models/Ordering Material Model/CommonOrderMaterialHistory Model/commonOrderMaterialHistory.model';
import { timerFunctionlity } from '../../../../utils/common features/timerFuncitonality';
import { generateCommonOrderHistoryPDF, 
    // gerneateCommonOrdersPdf
 } from '../pdfOrderHistory.controller';
import mongoose, {Types} from 'mongoose';
import ProcurementModelNew from '../../../../models/Department Models/ProcurementNew Model/procurementNew.model';
import { syncAccountingRecord } from '../../../Department controllers/Accounting Controller/accounting.controller';

export const createCommonOrderProjectName = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {


        const timer: IOrderHistorytimer = {
            startedAt: new Date(),
            completedAt: null,
            deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            reminderSent: false,
        };

        const { organizationId } = req.params
        const { projectName } = req.body;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required" });
        }

        const newOrder = await CommonOrderHistoryModel.create({
            organizationId,
            projectName: projectName || null,
            status: "pending",
            isEditable: true,
            selectedUnits: [],
            totalCost: 0,
            pdfLink: [],
            timer: timer
        });

        return res.status(201).json({ ok: true, data: newOrder });
    } catch (err) {
        console.error("Error creating project order:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};


export const editCommonOrderProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { projectName } = req.body;

        const updatedOrder = await CommonOrderHistoryModel.findByIdAndUpdate(
            { _id: id },
            { $set: { projectName } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ ok: false, message: "Order not found" });
        }

        return res.json({ ok: true, data: updatedOrder });
    } catch (err) {
        console.error("Error editing project order:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};




export const deleteCommonOrderProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const deleted = await CommonOrderHistoryModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ ok: false, message: "Order not found" });
        }

        return res.json({ ok: true, message: "Order deleted successfully" });
    } catch (err) {
        console.error("Error deleting project order:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};




// CREATION OF SELECTED UNITS(MAIN UNITS)
// export const createCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;
//         const { quantity, unitName, singleUnitCost } = req.body;

//         if (!unitName) {
//             return res.status(404).json({ ok: false, message: "Unit Name is required" });
//         }

//         const newUnit = {
//             category: null,
//             unitId: null,
//             image: null,
//             customId: null,
//             quantity: quantity || 1,
//             unitName: unitName?.trim(),
//             dimention: null,
//             singleUnitCost: singleUnitCost || 0,
//             subItems: [],
//         };

//         // const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
//         //     { projectId: projectId },
//         //     { $push: { selectedUnits: newUnit } },
//         //     { new: true }
//         // );

//         const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
//             {
//                 _id: id,
//                 "selectedUnits.unitName": { $ne: unitName }
//             },
//             {
//                 $push: {
//                     selectedUnits: newUnit
//                 }
//             },
//             { new: true }
//         );

//         if (updatedOrder) {
//             const totalCost = updatedOrder.selectedUnits.reduce(
//                 (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
//                 0
//             );
//             updatedOrder.totalCost = totalCost;
//             await updatedOrder.save();
//         }

//         if (!updatedOrder) {
//             return res.status(404).json({ ok: false, message: "Item Name already exists" });
//         }

//         return res.status(201).json({ ok: true, data: updatedOrder });
//     } catch (err) {
//         console.error("Error creating ordering unit:", err);
//         res.status(500).json({ ok: false, message: "Internal Server Error" });
//     }
// };




// export const editCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id, unitId } = req.params;
//         const { unitName, quantity, singleUnitCost } = req.body;



//         const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
//             { _id: id, "selectedUnits._id": unitId },
//             {
//                 $set: {
//                     "selectedUnits.$.unitName": unitName,
//                     "selectedUnits.$.quantity": quantity,
//                     "selectedUnits.$.singleUnitCost": singleUnitCost,
//                     // "selectedUnits.$.category": category,
//                     // "selectedUnits.$.image": image,
//                     // "selectedUnits.$.dimention": dimention,
//                 },
//             },
//             { new: true }
//         );

//         if (updatedOrder) {
//             const totalCost = updatedOrder.selectedUnits.reduce(
//                 (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
//                 0
//             );
//             updatedOrder.totalCost = totalCost;
//             await updatedOrder.save();
//         }



//         if (!updatedOrder) {
//             return res.status(404).json({ ok: false, message: "Ordering unit not found" });
//         }

//         return res.json({ ok: true, data: updatedOrder });
//     } catch (err) {
//         console.error("Error editing ordering unit:", err);
//         res.status(500).json({ ok: false, message: "Internal Server Error" });
//     }
// };


// export const deleteCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id, unitId } = req.params;


//         const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
//             { _id: id },
//             { $pull: { selectedUnits: { _id: unitId } } },
//             { new: true }
//         );

//         if (updatedOrder) {
//             const totalCost = updatedOrder.selectedUnits.reduce(
//                 (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
//                 0
//             );
//             updatedOrder.totalCost = totalCost;
//             await updatedOrder.save();
//         }

//         if (!updatedOrder) {
//             return res.status(404).json({ ok: false, message: "Ordering unit not found" });
//         }

//         return res.json({ ok: true, message: "Ordering unit deleted successfully", data: updatedOrder });
//     } catch (err) {
//         console.error("Error deleting ordering unit:", err);
//         res.status(500).json({ ok: false, message: "Internal Server Error" });
//     }
// };




// export const addCommonSubItemToUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id, unitId } = req.params;
//         const { subItemName, quantity, unit } = req.body;

//         if (!id || !unitId) {
//             return res.status(400).json({ ok: false, message: "Invalid projectId or unitId" });
//         }


//         // console.log("enmter", subItemName, quantity, unit)

//         if (!subItemName?.trim()) {
//             return res.status(400).json({ ok: false, message: "Mateial Item is mandatory" });
//         }


//         if (quantity === null) {
//             return res.status(400).json({ ok: false, message: "Missing Quantity" });
//         }

//         if (!unit) {
//             return res.status(400).json({ ok: false, message: "Missing Unit" });
//         }

//         const orderDoc = await CommonOrderHistoryModel.findById({ _id: id });
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

//         // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

//         return res.json({ ok: true, message: "SubItem added", subItems: unitObj.subItems });
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



// export const updateCommonSubItemInUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id, unitId, subItemId } = req.params;
//         const { subItemName, quantity, unit } = req.body;
//         // console.log("subitem name", subItemName)
//         if (!id ||
//             !unitId ||
//             !subItemId) {
//             return res.status(400).json({ ok: false, message: "Invalid IDs" });
//         }

//         if (!subItemName?.trim()) {
//             return res.status(400).json({ message: "material name is requried", ok: false })
//         }

//         const orderDoc = await CommonOrderHistoryModel.findById(id);
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

//         subItemObj.subItemName = subItemName.trim();
//         if (quantity !== null) subItemObj.quantity = quantity;
//         if (!unit !== undefined) subItemObj.unit = unit;

//         await orderDoc.save();

//         // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

//         return res.json({ ok: true, message: "SubItem updated", subItem: subItemObj });
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



// export const deleteCommonSubItemFromUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id, unitId, subItemId } = req.params;

//         if (!id ||
//             !unitId ||
//             !subItemId) {
//             return res.status(400).json({ ok: false, message: "Invalid IDs" });
//         }

//         const orderDoc = await CommonOrderHistoryModel.findById(id);
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

//         unitObj.subItems.pull({ _id: subItemId });
//         await orderDoc.save();

//         // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


//         return res.json({ ok: true, message: "SubItem deleted", subItems: unitObj.subItems });
//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };



export const updateCommonOrderDeliveryLocationDetails = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        if (!siteName || !address || !siteSupervisor || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All delivery location details are required." });
        }

        const orderingDoc = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id },

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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })


        res.status(200).json({ ok: true, message: "Delivery location updated", data: orderingDoc.deliveryLocationDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe delivery details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};




export const updateCommonOrderShopDetails = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;



        if (!shopName || !address || !contactPerson || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All shop details are required." });
        }

        const orderingDoc = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id },
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })



        res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.shopDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



export const getCommonOrderHistoryMaterial = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // // await redisClient.del(redisMainKey)
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {
        //     return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        // }


        const doc = await CommonOrderHistoryModel.find({ organizationId })

        if (!doc) return res.status(404).json({ ok: true, message: "Data not found", data: [] });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })

        return res.status(200).json({ ok: true, data: doc });

    }
    catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}




export const getSingleproject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // // await redisClient.del(redisMainKey)
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {
        //     return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        // }


        const doc = await CommonOrderHistoryModel.findById(id)

        if (!doc) return res.status(404).json({ ok: true, message: "Data not found", data: null });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })

        return res.status(200).json({ ok: true, data: doc });

    }
    catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}

// export const setOrderMaterialHistoryStageDeadline = (req: RoleBasedRequest, res: Response): Promise<any> => {
//     return handleSetStageDeadline(req, res, {
//         model: CommonOrderHistoryModel,
//         stageName: "Coomon OrderHistir"
//     });
// };


//  NOT IN USE 
export const commonOrderMaterialHistoryCompletionStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const form = await CommonOrderHistoryModel.findById(id);

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {

        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`

        // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: form })


        res.status(200).json({ ok: true, message: "order material stage marked as completed", data: form });


    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};




// Controller function (not in use)
// export const generateCommonOrderPDFController = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;

//         if (!id) {
//             return res.status(400).json({
//                 ok: false,
//                 message: 'project ID is required'
//             });
//         }

//         const result = await gerneateCommonOrdersPdf(id); // need to change it dont use it as it is create a new generate orderhisotrypdf  for this common thisngs 

//         // await populateWithAssignedToField({ stageModel: CommonOrderHistoryModel, projectId, dataToCache: result.data })


//         res.status(200).json(result);

//     } catch (error: any) {
//         console.error('PDF generation controller error:', error);
//         res.status(500).json({
//             ok: false,
//             message: error.message || 'Internal server error'
//         });
//     }
// };



// DELETE PDF API  (not in use)
export const deleteCommonOrderPdf = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, pdfId } = req.params;

        // 1. Find the pdf record in DB
        // const orderDoc = await OrderMaterialHistoryModel.findOne({
        //   projectId,
        //   generatedLink:{
        //     $pull: {_id: pdfId}
        //   }
        // });

        const orderDoc = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id },
            { $pull: { pdfLink: { _id: pdfId } } },
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


        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


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




// (not in use)
export const updateCommonOrderPdfStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, pdfId } = req.params; // order history and pdf doc inside generatedLink
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
        const updatedDoc = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id, "pdfLink._id": pdfId },
            { $set: { "pdfLink.$.status": status } },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({ ok: false, message: "Order history or PDF not found" });
        }

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











//  NEWER VERSION




export const uploadCommonOrderMaterialImages = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded.", ok: false });
        }

        const mappedFiles: Omit<IPdfGenerator, "status" | "refUniquePdf" | "pdfName">[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                _id: new mongoose.Types.ObjectId(),
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });



        const orderingDoc = await CommonOrderHistoryModel.findByIdAndUpdate(id, {
            $push: { images: { $each: mappedFiles } }
        }, { new: true });

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to upload the images." });
        }

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderingDoc })

        res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.images || [] });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



export const deleteCommonOrderingMaterialImage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, imageId } = req.params;

        // 1. Find the pdf record in DB
        // const orderDoc = await OrderMaterialHistoryModel.findOne({
        //   projectId,
        //   generatedLink:{
        //     $pull: {_id: pdfId}
        //   }
        // });

        const orderDoc = await CommonOrderHistoryModel.findByIdAndUpdate(
            id,
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


        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


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



export const addCommonOrderSubItemToUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { subItemName, quantity, unit } = req.body;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid id" });
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

        const orderDoc = await CommonOrderHistoryModel.findById(id);
        if (!orderDoc) {
            return res.status(404).json({ ok: false, message: "Common Order history not found" });
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        res.json({ ok: true, message: "SubItem added", subItems: orderDoc.currentOrder.subItems });

        // updateInventoryRemainingQuantity({ itemName: subItemName, orderedQuantity: quantity })
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateCommonOrderSubItemInUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, subItemId } = req.params;
        const { subItemName, quantity, unit } = req.body;
        // console.log("subitem name", subItemName)
        if (!id || !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        if (!subItemName?.trim()) {
            return res.status(400).json({ message: "material name is requried", ok: false })
        }

        const orderDoc = await CommonOrderHistoryModel.findById(id);
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, id, dataToCache: orderDoc })

        res.status(200).json({ ok: true, message: "SubItem updated", subItem: subItemObj });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteCommonOrderSubItemFromUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, subItemId } = req.params;

        if (!id || !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        const orderDoc = await CommonOrderHistoryModel.findById(id);
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        res.json({ ok: true, message: "SubItem deleted", subItems: orderDoc.currentOrder.subItems });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteCommonOrderAllSubUnitsNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid ID" });
        }

        const orderDoc = await CommonOrderHistoryModel.findById(id);
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        res.json({ ok: true, message: "All SubItem deleted", data: orderDoc.currentOrder.subItems });



    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const submitCommonOrderMaterial = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }


        const orderDoc = await CommonOrderHistoryModel.findById(
            id
        );

        if (!orderDoc) {
            return res.status(404).json({ message: "Common order not found", ok: false });
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
        // const rawProjectId = (orderDoc.projectId as any)._id.toString().slice(-3);
        const rawId = id.toString().slice(-3);

        const orderNumber = `ORD-${rawId}-${currentYear}-${paddedNumber}`;


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

        const newOrderMaterialNumber = `ORD-${rawId}-${currentYear}-${nextPadNumber}`;

        orderDoc.currentOrder.orderMaterialNumber = newOrderMaterialNumber
        orderDoc.currentOrder.subItems = [];
        orderDoc.images = [];

        await orderDoc.save()


        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.status(200).json({ data: orderDoc, message: "updated in the orderedItems", ok: true });

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};




export const getSingleCommonOrderedItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, orderItemId } = req.params;

        // const redisMainKey = `stage:OrderMaterialHistoryModel:${id}`
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {

        //     cachedData.orderedItems
        //     return res.status(200).json({ message: "data fetched from the cache for single order item", data: JSON.parse(cachedData), ok: true })
        // }

        const doc = await CommonOrderHistoryModel.findById(id);
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


export const placeCommonOrderToProcurement = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, orderItemId, organizationId } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: ' ID is required'
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

        const orderDoc = await CommonOrderHistoryModel.findById(id);

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

        orderItem.subItems.forEach((subItem: any) => {
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
            projectId: null,
            shopDetails: orderItem.shopDetails,
            deliveryLocationDetails: orderItem.deliveryLocationDetails,
            selectedUnits: ProcurementNewItems,
            refPdfId: orderItemId,
            isSyncWithPaymentsSection: false,
            isConfirmedRate: false,

            fromDeptNumber: orderItem?.orderMaterialNumber,
            fromDeptName: "Common Order Material",
            fromDeptModel: "CommonOrderHistoryModel",
            fromDeptRefId: orderDoc._id as Types.ObjectId,
            totalCost: 0
        });

        await syncAccountingRecord({
            organizationId: organizationId! || null,
            projectId: null,

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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


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
export const generateCommonOrderHistoryPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, organizationId, orderItemId } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: ' ID is required'
            });
        }

        if (!orderItemId) {
            return res.status(400).json({
                ok: false,
                message: 'OrderItemId is required'
            });
        }

        const result = await generateCommonOrderHistoryPDF(id, organizationId, orderItemId);

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: result?.data?.orderHistory })


        res.status(200).json(result);

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};