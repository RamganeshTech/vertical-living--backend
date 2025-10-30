import { Request, Response } from "express";
import ProcurementModelNew from "../../../models/Department Models/ProcurementNew Model/procurementNew.model";
import { generateProcurementPdf } from "./procurementPdf";
import { LogisticsShipmentModel } from "../../../models/Department Models/Logistics Model/logistics.model";
import { createShipmentUtil } from "../Logistics Controllers/logistics.controller";
import { createAccountingEntry } from "../Accounting Controller/accounting.controller";

export const getProcurementNewDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, organizationId } = req.query;

        const filters: any = { organizationId };

  if (projectId) filters.projectId = projectId; // ✅ properly assign
  // 
  
  // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // // await redisClient.del(redisMainKey)
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {
        //     return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        // }

        const doc = await ProcurementModelNew.find(filters).sort({createdAt : -1});
        if (!doc) return res.status(200).json({ ok: true, message: "Data not found", data: [] });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })


        return res.status(200).json({ ok: true, data: doc, message: "data found" });

    }
    catch (error: any) {
        console.log("error ", error)
        return res.status(500).json({ ok: false, message: error.message });
    }
}



export const getProcurementNewSingleItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
        // // await redisClient.del(redisMainKey)
        // const cachedData = await redisClient.get(redisMainKey)

        // if (cachedData) {
        //     return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        // }

        const doc = await ProcurementModelNew.findById(id);
        if (!doc) return res.status(404).json({ ok: true, message: "Data not found", data: null });

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })


        return res.status(200).json({ ok: true, data: doc, message: "data found" });

    }
    catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
}




export const updateProcurementDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        // if (!siteName || !address || !siteSupervisor || !phoneNumber) {
        //     return res.status(400).json({ ok: false, message: "All delivery location details are required." });
        // }


         if(phoneNumber?.trim()  && phoneNumber.length !== 10){
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await ProcurementModelNew.findByIdAndUpdate(
            id,
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

        // await populateWithAssignedToField({ stageModel: ProcurementModelNew, projectId, dataToCache: orderingDoc })


        res.status(200).json({ ok: true, message: "Delivery location updated", data: orderingDoc.deliveryLocationDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe delivery details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};




export const updateProcurementShopDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { shopName, address, contactPerson, phoneNumber, upiId } = req.body;



        // if (!shopName || !address || !contactPerson || !phoneNumber) {
        //     return res.status(400).json({ ok: false, message: "All shop details are required." });
        // }


        if(phoneNumber?.trim()  && phoneNumber.length !== 10){
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await ProcurementModelNew.findByIdAndUpdate(
            id,
            {
                $set: {
                    shopDetails: { shopName, address, contactPerson, phoneNumber , upiId },
                },
            },
            { new: true, upsert: true }
        );

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to update shop details." });
        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

        // await populateWithAssignedToField({ stageModel: ProcurementModelNew, projectId, dataToCache: orderingDoc })



        res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.shopDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};


export const updateProcurementTotalCost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { totalCost } = req.body;

        const orderingDoc = await ProcurementModelNew.findByIdAndUpdate(
            id,
            {
                $set: {
                    totalCost: totalCost,
                },
            },
            { new: true }
        );

        if (!orderingDoc) {
            return res.status(400).json({ ok: false, message: "Failed to update shop details." });
        }

        // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

        // await populateWithAssignedToField({ stageModel: ProcurementModelNew, projectId, dataToCache: orderingDoc })



        res.status(200).json({ ok: true, message: "total cost updated", data: orderingDoc.shopDetails });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



// Controller function
export const generateProcurementPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: 'ID is required'
            });
        }

        const result = await generateProcurementPdf(id);

        // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: result.data })


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
export const deleteProcurementPdf = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, pdfId } = req.params;

        // 1. Find the pdf record in DB
        // const orderDoc = await OrderMaterialHistoryModel.findOne({
        //   projectId,
        //   generatedLink:{
        //     $pull: {_id: pdfId}
        //   }
        // });

        const orderDoc = await ProcurementModelNew.findByIdAndUpdate(
            id,
            { $pull: { procurementPdfs: { _id: pdfId } } },
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


export const deleteprocurement = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid id" });
        }
console.log("pricrement deelted", id )
        const shipment = await ProcurementModelNew.findByIdAndDelete(id);

        if (!shipment) {
            return res.status(404).json({ ok: false, message: "procurement not found" });
        }

        // Respond immediately ✅
        res.status(200).json({ ok: true, message: "Item deleted successfully" });

        // Remove the shipment from LogisticsMainModel.projectShipments in background ⏱
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Failed to delete shipment", error: err.message });
    }
};


export const syncLogisticsDept = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid id" });
        }

        const procurement = await ProcurementModelNew.findById(id).populate("projectId")

        if (!procurement) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        console.log("procurementdetails", procurement)
        // Minimal info
        const shipment = await createShipmentUtil({
            organizationId: procurement.organizationId,
            projectId: procurement.projectId,
            projectName: (procurement.projectId as any).projectName,
            items: procurement.selectedUnits.map((item) => {
                return ({
                    name: item.subItemName,
                    quantity: item.quantity
                })
            }),
            vehicleDetails: {},
            origin: {
                address: procurement?.shopDetails?.address || null,
                contactPerson: procurement?.shopDetails?.contactPerson || null,
                contactPhone: procurement?.shopDetails?.phoneNumber || null
            },
            destination:{
                address: procurement?.deliveryLocationDetails?.address || null,
                contactPerson: procurement?.deliveryLocationDetails?.siteSupervisor || null,
                contactPhone: procurement?.deliveryLocationDetails?.phoneNumber || null
            }
        })


        if (!shipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        res.status(200).json({ ok: true, message: "Detials sent to Logsitics Dept successfully" });

    } catch (err: any) {
        return res.status(500).json({ ok: false, error: "Failed to sync Logistics shipment", message: err?.message });
    }
}




export const SyncAccountingFromProcurement = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.params;
        const { totalCost, upiId } = req.body;

        if (!organizationId || !projectId) {
            return res.status(400).json({ ok: false, message: "OrganizationId and  ProjectId is required" });
        }

        const doc = await createAccountingEntry({
            organizationId,
            projectId,
            fromDept: "procurement",
            totalCost,
            upiId
        });

        res.status(201).json({ ok: true, data: doc });
    } catch (err: any) {
        console.error("Error sending logistics entry to accounting:", err);
        res.status(500).json({ ok: false, message: err.message });
    }
}
