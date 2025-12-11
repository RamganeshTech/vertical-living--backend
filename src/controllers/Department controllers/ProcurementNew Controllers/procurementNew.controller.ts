import { Request, Response } from "express";
import ProcurementModelNew, { IProcurementItemsNew } from "../../../models/Department Models/ProcurementNew Model/procurementNew.model";
import { generateProcurementPdf } from "./procurementPdf";
import { createShipmentUtil } from "../Logistics Controllers/logistics.controller";
import { decryptCryptoToken, encryptCryptoToken } from "../../../utils/common features/utils";
import crypto from 'crypto';
import mongoose, { Types } from "mongoose";
import { createPaymentMainAccUtil } from "../Accounting Controller/PaymentMainAcc_controllers/paymentMainAcc.controller";
import { AccountingModel } from "../../../models/Department Models/Accounting Model/accountingMain.model";
import { OrderMaterialHistoryModel } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";

// export const getProcurementNewDetails = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, organizationId } = req.query;

//         const filters: any = { organizationId };

//         if (projectId) filters.projectId = projectId; // ✅ properly assign
//         // 

//         // const redisMainKey = `stage:OrderMaterialHistoryModel:${projectId}`
//         // // await redisClient.del(redisMainKey)
//         // const cachedData = await redisClient.get(redisMainKey)

//         // if (cachedData) {
//         //     return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
//         // }

//         const doc = await ProcurementModelNew.find(filters).sort({ createdAt: -1 }).populate("projectId", "projectName _id")
//         if (!doc) return res.status(200).json({ ok: true, message: "Data not found", data: [] });

//         // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
//         // await populateWithAssignedToField({ stageModel: OrderMaterialHistoryModel, projectId, dataToCache: doc })


//         return res.status(200).json({ ok: true, data: doc, message: "data found" });

//     }
//     catch (error: any) {
//         console.log("error ", error)
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// }



export const getProcurementNewDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            projectId,
            page,
            limit,
            search,
            isSyncWithPaymentsSection,
            isConfirmedRate,
            minAmount,
            maxAmount,
            fromDate,

            toDate
        } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        // --- 1. Pagination Setup ---
        const pageNumber = parseInt(page as string) || 1;
        const pageSize = parseInt(limit as string) || 10;
        const skip = (pageNumber - 1) * pageSize;

        // --- 2. Build Query Filters ---
        const filters: any = { organizationId };

        if (projectId) filters.projectId = projectId;

        // Boolean Filters (Convert string "true"/"false" to boolean)
        if (isSyncWithPaymentsSection !== undefined && isSyncWithPaymentsSection !== "") {
            filters.isSyncWithPaymentsSection = isSyncWithPaymentsSection === 'true';
        }

        // if (isConfirmedRate !== undefined && isConfirmedRate !== "") {
        //     filters.isConfirmedRate = isConfirmedRate === 'true';
        // }

        // Number Filter
        if (minAmount || maxAmount) {
            filters.totalCost = {};
            if (minAmount) filters.totalCost.$gte = Number(minAmount);
            if (maxAmount) filters.totalCost.$lte = Number(maxAmount);
        }

        // Date Range Filter (CreatedAt)
        if (fromDate || toDate) {
            filters.createdAt = {};
            if (fromDate) {
                filters.createdAt.$gte = new Date(fromDate as string);
            }
            if (toDate) {
                // Set time to end of day for the 'toDate'
                const endOfDay = new Date(toDate as string);
                endOfDay.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = endOfDay;
            }
        }

        // Search Logic (Procurement #, Shop Name, Order Material #)
        if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            filters.$or = [
                { procurementNumber: searchRegex },
                { fromDeptNumber: searchRegex }, // Order Material Ref
                { "shopDetails.shopName": searchRegex },
                { "shopDetails.contactPerson": searchRegex },
                { "deliveryLocationDetails.siteName": searchRegex },
                { "deliveryLocationDetails.siteSupervisor": searchRegex }
            ];
        }

        // --- 3. Execute Query ---
        const totalDocs = await ProcurementModelNew.countDocuments(filters);

        const docs = await ProcurementModelNew.find(filters)
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(pageSize)
            .populate("projectId", "projectName _id");

        // --- 4. Prepare Response for Infinite Query ---
        const hasNextPage = skip + docs.length < totalDocs;

        return res.status(200).json({
            ok: true,
            message: "Data fetched successfully",
            data: {
                items: docs,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalDocs / pageSize),
                totalItems: totalDocs,
                hasNextPage
            }
        });

    } catch (error: any) {
        console.error("Get Procurement Error:", error);
        return res.status(500).json({ ok: false, message: error.message || "Internal Server Error" });
    }
};


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



export const createProcurementOrder = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            projectId,
            fromDeptNumber,
            fromDeptRefId,
            selectedUnits = [],
            shopDetails,
            deliveryLocationDetails
        } = req.body;

        // -------------------------
        // Basic validations
        // -------------------------
        if (!organizationId || !projectId) {
            return res.status(400).json({
                ok: false,
                message: "organizationId and projectId are required"
            });
        }



        if (!fromDeptNumber) {
            return res.status(400).json({
                ok: false,
                message: "fromDeptNumber is required"
            });
        }

        // -------------------------
        // Validate Phone Number (if provided)
        // -------------------------
        if (deliveryLocationDetails?.phoneNumber?.trim() &&
            deliveryLocationDetails.phoneNumber.length !== 10) {

            return res.status(400).json({
                ok: false,
                message: "Site Location Phone Number should be 10 digits"
            });
        }

        if (shopDetails?.phoneNumber?.trim() &&
            shopDetails.phoneNumber.length !== 10) {

            return res.status(400).json({
                ok: false,
                message: "Shop Details Phone Number should be 10 digits"
            });
        }


        // // -------------------------
        // // Calculate totalCost from selectedUnits
        // // -------------------------
        // const calculatedTotalCost = selectedUnits.reduce((acc: number, item: any) => {
        //     const qty = item.quantity || 0;
        //     const rate = item.rate || 0;
        //     return acc + qty * rate;
        // }, 0);

        // -------------------------
        // Generate procurement number (simple pattern)
        // -------------------------

        // -------------------------
        // Create Document
        // -------------------------

        const isExisting = await ProcurementModelNew.findOne({ fromDeptNumber })

        let quoteNumber = 1;
        if (isExisting) {
            quoteNumber = (isExisting?.quoteNumber || 1) + 1
        }


        const newProcurement = new ProcurementModelNew({
            organizationId,
            projectId,

            quoteNumber: quoteNumber || 1,
            fromDeptNumber: fromDeptNumber || null,
            fromDeptRefId: fromDeptRefId ? new Types.ObjectId(fromDeptRefId) : null,
            fromDeptName: "Order Material",
            fromDeptModel: "OrderMaterialHistoryModel",

            shopDetails: shopDetails || {},
            deliveryLocationDetails: deliveryLocationDetails || {},

            selectedUnits,
            totalCost: 0,

            refPdfId: null,
            procurementPdfs: [],
            generatedLink: null,
            isConfirmedRate: false,
            isSyncWithPaymentsSection: false
        });


        const isSaved = await newProcurement.save()
        console.log("isSaved", isSaved)

        if (!isSaved?._id) {
            return res.status(400).json({
                ok: false,
                message: "Failed to create procurement order"
            });
        }

        // NOTE: You can integrate Redis cache here if needed
        // const redisKey = `stage:ProcurementModelNew:${projectId}`;
        // await redisClient.set(redisKey, JSON.stringify(newProcurement), { EX: 600 });

        return res.status(201).json({
            ok: true,
            message: "Procurement order created successfully",
            data: newProcurement
        });
    } catch (error: any) {
        console.error("Error creating procurement order:", error);
        return res.status(500).json({
            ok: false,
            message: "Server error"
        });
    }
};


export const getOrderMaterialRefPdfDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params; // OrderMaterialHistory _id

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: "projectId is required"
            });
        }

        // ------------------------------------
        // Fetch the order material history doc
        // ------------------------------------
        const doc = await OrderMaterialHistoryModel.findOne({ projectId })
            .select("_id projectId generatedLink")
            .populate("projectId", "_id projectName");

        if (!doc) {
            return res.status(200).json({
                ok: true,
                message: "Order Material not found for this project"
            });
        }

        const orderNumbers = doc?.orderedItems?.map(ele => {
            return {
                refUniquePdf: ele.orderMaterialNumber, //fromDeptNumber
                fromDeptRefId: doc._id!,
            }
        })

        // -------------------------------------------------
        // SUCCESS RESPONSE
        // -------------------------------------------------
        return res.status(200).json({
            ok: true,
            message: "Order material pdf reference fetched",
            data: orderNumbers || []
        });

    } catch (error: any) {
        console.error("Error fetching ref pdf number:", error);
        return res.status(500).json({
            ok: false,
            message: "Server error"
        });
    }
};

export const updateProcurementDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        // if (!siteName || !address || !siteSupervisor || !phoneNumber) {
        //     return res.status(400).json({ ok: false, message: "All delivery location details are required." });
        // }


        if (phoneNumber?.trim() && phoneNumber.length !== 10) {
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


        if (phoneNumber?.trim() && phoneNumber.length !== 10) {
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await ProcurementModelNew.findByIdAndUpdate(
            id,
            {
                $set: {
                    shopDetails: { shopName, address, contactPerson, phoneNumber, upiId },
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


// not used
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





const ALGO = "aes-256-cbc";

// Unique, safe 32-byte key only for procurement links
const PROCUREMENT_SECRET = crypto
    .createHash("sha256")
    .update("PROCUREMENT_UNIQUE_SECRET_KEY_12345")
    .digest(); // <-- ALWAYS 32 bytes

const encryptProcurementToken = (payload: object) => {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGO, PROCUREMENT_SECRET, iv);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), "utf8"),
        cipher.final(),
    ]);

    return iv.toString("base64") + ":" + encrypted.toString("base64");
};


const decryptProcurementToken = (token: string) => {
    try {
        // Token format: iv:encrypted
        const [ivStr, encryptedData] = token.split(":");
        if (!ivStr || !encryptedData) {
            throw new Error("Invalid token format");
        }

        const iv = Buffer.from(ivStr, "base64");
        const encryptedBuffer = Buffer.from(encryptedData, "base64");

        const decipher = crypto.createDecipheriv(ALGO, PROCUREMENT_SECRET, iv);

        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString("utf8"));
    } catch (err) {
        throw new Error("Failed to decrypt token: " + (err as Error).message);
    }
};


//  public usage
export const generateSecureProcurementLink = async (req: Request, res: Response): Promise<any> => {
    try {
        const { orderId } = req.params;


        const token = crypto.randomBytes(16).toString("hex");

        // const token = encryptProcurementToken({
        //     orderId,
        //     createdAt: Date.now() // for expiry checks later if needed
        // });

        const procurement = await ProcurementModelNew.findByIdAndUpdate(orderId, { generatedLink: token }, { new: true })

        if (!procurement) {
            return res.status(404).json({ ok: false, message: "Order not found" });
        }

        // const generatedLink = `${process.env.FRONTEND_URL}/${procurement?.organizationId}/procurement/public/${token}`;


        // procurement.generatedLink = generatedLink
        // await procurement.save();

        return res.json({
            ok: true,
            message: "Secure token generated",
            data: { token: procurement.generatedLink }
        });
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: err.message });
    }
};



export const getProcurementItemsPublic = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, orderId } = req.query;
        // const decodedToken = decodeURIComponent(token as string);

        if (!token) {
            return res.status(400).json({ ok: false, message: "Token not provided" });
        }

        // const decoded = decryptProcurementToken(decodedToken);

        // if (decoded.type !== "PROCUREMENT_RATE")
        //     return res.status(400).json({ ok: false, message: "Invalid token type" });

        if (!orderId) {
            return res.status(400).json({ ok: false, message: "Order Id is not provided" });
        }

        const order = await ProcurementModelNew.findById(orderId);

        if (!order)
            return res.status(404).json({ ok: false, message: "Order not found" });

        // if (order.isConfirmedRate)
        //     return res.status(403).json({ ok: false, message: "Rates already submitted" });

        return res.json({
            ok: true,
            data: {
                selectedUnits: order?.selectedUnits,
                shopDetails: order.shopDetails,
                deliveryLocationDetails: order.deliveryLocationDetails,
                isConfirmedRate: order.isConfirmedRate
            }
        });

    } catch (err: any) {
        return res.status(500).json({ ok: false, message: err.message });
    }
};



//  UPDATE ALL THE PROCUREMENT RATE (not used)
export const updateProcurementItemRate = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, orderId } = req.query;
        // const decodedToken = decodeURIComponent(token as string);

        if (!token) {
            return res.status(400).json({ ok: false, message: "Token not provided" });
        }


        if (!orderId) {
            return res.status(400).json({ ok: false, message: "Order Id not provided" });
        }


        const { selectedUnits } = req.body; // full items array sent by shopkeeper

        if (!Array.isArray(selectedUnits) || selectedUnits.length === 0)
            return res.status(400).json({ ok: false, message: "Invalid selectedUnits data" });

        const order = await ProcurementModelNew.findById(orderId);

        if (!order)
            return res.status(404).json({ ok: false, message: "Purchase order not found" });

        // ❌ Block edits if already submitted
        if (order.isConfirmedRate)
            return res.status(403).json({ ok: false, message: "Final submission already done" });

        // --- VALIDATION AND UPDATE ---
        // Compare incoming data with database items
        const updatedItems = order.selectedUnits.map((existingItem) => {
            const updatedItem = selectedUnits.find(u => u._id === String(existingItem._id));

            if (!updatedItem)
                throw new Error(`Item missing: ${existingItem._id}`);

            // ❌ Prevent changing quantity, unit, itemName
            if (
                updatedItem.quantity !== existingItem.quantity ||
                updatedItem.unit !== existingItem.unit ||
                updatedItem.subItemName !== existingItem.subItemName
            ) {
                throw new Error("You cannot modify itemName, qty or unit.");
            }

            // Validate rate
            if (updatedItem.rate == null || updatedItem.rate < 0) {
                throw new Error(`Invalid rate for item ${existingItem.subItemName}`);
            }

            // Update rate
            existingItem.rate = updatedItem.rate;
            existingItem.totalCost = (existingItem.quantity ?? 0) * updatedItem.rate;

            return existingItem;
        });

        // Assign updated items
        order.selectedUnits = updatedItems;

        // Recalculate total order cost
        order.totalCost = updatedItems.reduce(
            (sum, item) => sum + (item.totalCost || 0),
            0
        );

        // Mark as confirmed
        order.isConfirmedRate = true;

        await order.save();

        return res.json({
            ok: true,
            message: "All rates updated & submitted successfully",
            data: {
                selectedUnits: order.selectedUnits,
                totalCost: order.totalCost,
                isConfirmedRate: order.isConfirmedRate
            }
        });

    } catch (error: any) {
        console.error("Update procurement error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Internal Server Error"
        });
    }
};


export const updateProcurementSingleItemRate = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Extract Data
        // token, orderId, itemId come from Query String (?token=...&orderId=...&itemId=...)
        const { token, orderId, itemId } = req.query;

        // rate comes from Body ({ rate: 500 })
        const { rate } = req.body;

        // 2. Validations
        if (!token || !orderId || !itemId) {
            return res.status(400).json({ ok: false, message: "Missing required parameters (token, orderId, itemId)" });
        }

        if (rate === undefined || rate === null || rate < 0) {
            return res.status(400).json({ ok: false, message: "Invalid rate provided" });
        }

        // // 3. Security Check: Validate Token
        // const decoded = decryptCryptoToken(token as string);


        // 4. Find the Order
        const order = await ProcurementModelNew.findById(orderId);

        if (!order) {
            return res.status(404).json({ ok: false, message: "Order not found" });
        }

        // if (order.isConfirmedRate) {
        //     return res.status(403).json({ ok: false, message: "Price confirmed no changes allowed." });
        // }

        // 5. Check if Order is Locked (Optional)
        // If you want to allow edits even after confirmation, remove this block.
        // Usually, we block edits if the vendor has already hit "Submit Final".
        if (order?.isConfirmedRate) {
            return res.status(403).json({ ok: false, message: "Rates are already confirmed and locked." });
        }

        // 6. Find the Specific Item in selectedUnits
        const itemIndex = order.selectedUnits.findIndex((u) => u._id.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ ok: false, message: "Item not found in this order" });
        }

        const targetItem = order.selectedUnits[itemIndex];

        // 7. Update Logic
        // Update Rate
        targetItem.rate = Number(rate);

        // Recalculate Item Total (Quantity * New Rate)
        // Default quantity to 0 if missing to avoid NaN
        const qty = targetItem.quantity || 0;
        targetItem.totalCost = qty * Number(rate);

        // Update the array
        order.selectedUnits[itemIndex] = targetItem;

        // 8. Recalculate Grand Total for the whole Order
        order.totalCost = order.selectedUnits.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

        // 9. Save Changes
        await order.save();

        return res.json({
            ok: true,
            message: "Item rate updated",
            data: {
                itemId: targetItem._id,
                updatedRate: targetItem.rate,
                updatedItemTotal: targetItem.totalCost,
                grandTotal: order.totalCost
            }
        });

    } catch (error: any) {
        console.error("Update single item error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Internal Server Error"
        });
    }
};






// end of public controlers

export const deleteprocurement = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid id" });
        }
        console.log("pricrement deelted", id)
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


//  not used
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
            destination: {
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




export const sendProcurementToPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { procurementId } = req.params; // We expect the Bill ID to be sent

        // 1. Validate Bill ID
        if (!mongoose.Types.ObjectId.isValid(procurementId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid procurement ID format"
            });
        }

        // 2. Fetch the Bill
        const procurement = await ProcurementModelNew.findById(procurementId);
        if (!procurement) {
            return res.status(404).json({
                ok: false,
                message: "Procurement not found"
            });
        }


        if (procurement?.isSyncWithPaymentsSection) {
            return res.status(400).json({ message: "Procurement Already sent to the payment section", ok: false })
        }


        const paymentItems = procurement.selectedUnits.map((item: IProcurementItemsNew, index: number) => {
            return {
                itemName: item.subItemName,
                quantity: item.quantity,
                rate: item.rate,
                unit: item.unit || "",
                totalCost: item.totalCost,
                dueDate: null,
                status: "pending",
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: "",
                fees: null,
                tax: null
            }
        });


        const newPayemnt = await createPaymentMainAccUtil({
            paymentPersonId: null,
            paymentPersonModel: null,
            paymentPersonName: procurement?.shopDetails?.contactPerson || "",
            organizationId: procurement?.organizationId,
            accountingRef: null,
            projectId: procurement?.projectId || null,
            fromSectionModel: "ProcurementModelNew",
            fromSectionId: procurement._id as Types.ObjectId,
            fromSection: "Procurement",
            fromSectionNumber: procurement?.procurementNumber || procurement?.refPdfId || "",
            orderMaterialDeptNumber: procurement?.fromDeptNumber || null,
            orderMaterialRefId: (procurement as any)?.fromDeptRefId || null,
            paymentDate: null,
            dueDate: null,
            subject: "",
            procurementDeptValidation: "verified by procurement department",
            items: paymentItems,
            totalAmount: procurement.totalCost || 0,
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: 0,
            taxAmount: 0,
            grandTotal: procurement.totalCost || 0,
            paymentType: "",
            advancedAmount: {
                totalAmount: 0,
                status: 'pending',
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: null,
                fees: null,
                tax: null,
            },
            amountRemaining: {
                totalAmount: procurement?.totalCost || 0,
                status: 'pending',
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: null,
                fees: null,
                tax: null,
            },

            notes: null,
            isSyncedWithAccounting: false,
            generalStatus: "pending"
        })

        procurement.isConfirmedRate = true;
        procurement.isSyncWithPaymentsSection = true;
        await procurement.save()


        await AccountingModel.findOneAndUpdate(
            {
                orderMaterialRefId: procurement.fromDeptRefId,
            },
            {
                $set: {
                    // Update fields that might have changed in the bill
                    amount: procurement?.totalCost,
                    projectId: procurement?.projectId || null,
                    assoicatedPersonName: procurement?.shopDetails?.contactPerson || null,

                    deptGeneratedDate: (procurement as any).updatedAt || (procurement as any).createdAt || null,
                    deptNumber: procurement?.procurementNumber || null,
                    deptDueDate: null,

                    referenceId: procurement._id!,
                    referenceModel: "ProcurementModelNew",

                    // Optional: Update person ID if vendor changed
                    assoicatedPersonId: null,

                    // IMPORTANT: We DO NOT include 'status' or 'paymentId' here.
                    // Those are controlled by the Payment Controller.
                }
            },
            { new: true }
        );


        // await invalidateBillCache((bill as any).organizationId, (bill as any).vendorId, bill._id as string);


        return res.status(201).json({
            ok: true,
            message: "Sent to Payments Section successfully",
            data: newPayemnt
        });

    } catch (error: any) {
        console.error("Error sending Procurement order to payement:", error);
        return res.status(500).json({
            ok: false,
            message: "Error processing request",
            error: error.message
        });
    }
}