// controllers/orderHistory/createProjectOrder.ts

import { Response } from 'express';
import { IOrderHistorytimer, OrderSubItems } from '../../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { RoleBasedRequest } from '../../../../types/types';
import { CommonOrderHistoryModel } from './../../../../models/Stage Models/Ordering Material Model/CommonOrderMaterialHistory Model/commonOrderMaterialHistory.model';
import { handleSetStageDeadline, timerFunctionlity } from '../../../../utils/common features/timerFuncitonality';
import { generateOrderHistoryPDF, gerneateCommonOrdersPdf } from '../pdfOrderHistory.controller';
import mongoose from "mongoose"
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
export const createCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { quantity, unitName, singleUnitCost } = req.body;

        if (!unitName) {
            return res.status(404).json({ ok: false, message: "Unit Name is required" });
        }

        const newUnit = {
            category: null,
            unitId: null,
            image: null,
            customId: null,
            quantity: quantity || 1,
            unitName: unitName?.trim(),
            dimention: null,
            singleUnitCost: singleUnitCost || 0,
            subItems: [],
        };

        // const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
        //     { projectId: projectId },
        //     { $push: { selectedUnits: newUnit } },
        //     { new: true }
        // );

        const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
            {
                _id: id,
                "selectedUnits.unitName": { $ne: unitName }
            },
            {
                $push: {
                    selectedUnits: newUnit
                }
            },
            { new: true }
        );

        if (updatedOrder) {
            const totalCost = updatedOrder.selectedUnits.reduce(
                (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
                0
            );
            updatedOrder.totalCost = totalCost;
            await updatedOrder.save();
        }

        if (!updatedOrder) {
            return res.status(404).json({ ok: false, message: "Item Name already exists" });
        }

        return res.status(201).json({ ok: true, data: updatedOrder });
    } catch (err) {
        console.error("Error creating ordering unit:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};




export const editCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, unitId } = req.params;
        const { unitName, quantity, singleUnitCost } = req.body;



        const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id, "selectedUnits._id": unitId },
            {
                $set: {
                    "selectedUnits.$.unitName": unitName,
                    "selectedUnits.$.quantity": quantity,
                    "selectedUnits.$.singleUnitCost": singleUnitCost,
                    // "selectedUnits.$.category": category,
                    // "selectedUnits.$.image": image,
                    // "selectedUnits.$.dimention": dimention,
                },
            },
            { new: true }
        );

        if (updatedOrder) {
            const totalCost = updatedOrder.selectedUnits.reduce(
                (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
                0
            );
            updatedOrder.totalCost = totalCost;
            await updatedOrder.save();
        }



        if (!updatedOrder) {
            return res.status(404).json({ ok: false, message: "Ordering unit not found" });
        }

        return res.json({ ok: true, data: updatedOrder });
    } catch (err) {
        console.error("Error editing ordering unit:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};


export const deleteCommonOrderingUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, unitId } = req.params;
    

        const updatedOrder = await CommonOrderHistoryModel.findOneAndUpdate(
            { _id: id },
            { $pull: { selectedUnits: { _id: unitId } } },
            { new: true }
        );

         if (updatedOrder) {
            const totalCost = updatedOrder.selectedUnits.reduce(
                (sum, unit) => sum + (unit.quantity * unit.singleUnitCost),
                0
            );
            updatedOrder.totalCost = totalCost;
            await updatedOrder.save();
        }

        if (!updatedOrder) {
            return res.status(404).json({ ok: false, message: "Ordering unit not found" });
        }

        return res.json({ ok: true, message: "Ordering unit deleted successfully", data: updatedOrder });
    } catch (err) {
        console.error("Error deleting ordering unit:", err);
        res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};




export const addCommonSubItemToUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, unitId } = req.params;
        const { subItemName, quantity, unit } = req.body;

        if (!id || !unitId) {
            return res.status(400).json({ ok: false, message: "Invalid projectId or unitId" });
        }


        // console.log("enmter", subItemName, quantity, unit)

        if (!subItemName?.trim()) {
            return res.status(400).json({ ok: false, message: "Mateial Item is mandatory" });
        }


        if (quantity === null) {
            return res.status(400).json({ ok: false, message: "Missing Quantity" });
        }

        if (!unit) {
            return res.status(400).json({ ok: false, message: "Missing Unit" });
        }

        const orderDoc = await CommonOrderHistoryModel.findById({ _id: id });
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        return res.json({ ok: true, message: "SubItem added", subItems: unitObj.subItems });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateCommonSubItemInUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, unitId, subItemId } = req.params;
        const { subItemName, quantity, unit } = req.body;
        // console.log("subitem name", subItemName)
        if (!id ||
            !unitId ||
            !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        if (!subItemName?.trim()) {
            return res.status(400).json({ message: "material name is requried", ok: false })
        }

        const orderDoc = await CommonOrderHistoryModel.findById(id);
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })

        return res.json({ ok: true, message: "SubItem updated", subItem: subItemObj });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteCommonSubItemFromUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, unitId, subItemId } = req.params;

        if (!id ||
            !unitId ||
            !subItemId) {
            return res.status(400).json({ ok: false, message: "Invalid IDs" });
        }

        const orderDoc = await CommonOrderHistoryModel.findById(id);
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

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: orderDoc })


        return res.json({ ok: true, message: "SubItem deleted", subItems: unitObj.subItems });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



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




// Controller function
export const generateCommonOrderPDFController = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: 'project ID is required'
            });
        }

        const result = await gerneateCommonOrdersPdf(id); // need to change it dont use it as it is create a new generate orderhisotrypdf  for this common thisngs 

        // await populateWithAssignedToField({ stageModel: CommonOrderHistoryModel, projectId, dataToCache: result.data })


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