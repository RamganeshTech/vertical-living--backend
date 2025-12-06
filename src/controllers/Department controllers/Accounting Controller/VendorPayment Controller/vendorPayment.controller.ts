import { Request, Response } from "express";
import mongoose, {Types} from "mongoose";
import { RoleBasedRequest } from "../../../../types/types";
import redisClient from "../../../../config/redisClient";
import { IVendorPayment, IVendorPaymentItems, VendorPaymentAccountModel } from "../../../../models/Department Models/Accounting Model/vendorPaymentAcc.model";
import { syncAccountingRecord } from "../accounting.controller";
import { AccountingModel } from "../../../../models/Department Models/Accounting Model/accountingMain.model";
import { createPaymentMainAccUtil } from "../PaymentMainAcc_controllers/paymentMainAcc.controller";

// Helper function to generate unique purchase number
// Helper function to calculate purchase totals
const calculateVendorPaymentTotals = (
    items: IVendorPaymentItems[],
    // discountPercentage: number = 0,
    // taxPercentage: number = 0
) => {
    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
        return sum + (item.billAmount || 0);
    }, 0);

    // Calculate discount amount
    // const discountAmount = (totalAmount * discountPercentage) / 100;

    // // Calculate amount after discount
    // const amountAfterDiscount = totalAmount - discountAmount;

    // // Calculate tax amount on the discounted amount
    // const taxAmount = (amountAfterDiscount * taxPercentage) / 100;

    // // Calculate grand total
    // const grandTotal = amountAfterDiscount + taxAmount;

    return {
        totalAmount,
        // discountAmount,
        // taxAmount,
        // grandTotal
    };
};

// Manual validation function
type ExceptPaymentNumber = Omit<IVendorPayment, "paymentNumber">
const validateVendorPaymentData = (data: ExceptPaymentNumber): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check mandatory fields
    if (!data.vendorName || data.vendorName.trim() === '') {
        errors.push("Vendor name is required");
    }

    // if (!data.vendorId) {
    //     errors.push("Vendor ID is required");
    // }

    if (!data.organizationId) {
        errors.push("Organization ID is required");
    }

    // Validate vendorId format
    if (data.vendorId && !mongoose.Types.ObjectId.isValid(data.vendorId)) {
        errors.push("Invalid vendor ID format");
    }

    // Validate organizationId format
    if (data.organizationId && !mongoose.Types.ObjectId.isValid(data.organizationId)) {
        errors.push("Invalid organization ID format");
    }

    if (typeof data.totalAmount !== "number" || data.totalAmount < 0) {
        errors.push(`total amount should be a  non negative number`);
    }

    if (data?.items && data?.items?.length === 0) {
        errors.push(`Atleast one item should be provided`);

    }

    if (data?.items && Array.isArray(data.items) && data?.items?.length > 0) {
        data.items.forEach((item: IVendorPaymentItems, index: number) => {
            if (typeof item.billAmount !== "number" || item.billAmount < 0) {
                errors.push(`${index + 1}: bill amount should be a  non negative number`);
            }

            if (typeof item.itemName !== "string" || item.itemName?.trim() === "") {
                errors.push(`${index + 1}: item Name should be a filled`);
            }

            // if (typeof item.rate === 'number' && item.rate < 0) {
            //     errors.push(`Item ${index + 1}: Rate cannot be negative`);
            // }

            // if (typeof item.quantity === 'number' && item.quantity < 0) {
            //     errors.push(`Item ${index + 1}: Quantity cannot be negative`);
            // }

            // if (item.paymentDate && isNaN(new Date(item.paymentDate).getTime())) {
            //     errors.push(`${index + 1}: Payment made on should be a date`);
            // }
        });
    }

    // Validate numeric fields are not negative
    // const numericFields:(keyof IVendorPayment)[] = [
    //     'totalAmount', 'totalDueAmount'
    // ];

    // numericFields.forEach((field)  => {
    //     if (data[field] !== undefined && data[field] !== null && typeof data[field] === 'number' && data[field] < 0) {
    //         errors.push(`${field} cannot be negative`);
    //     }
    // });


    const numericFields: (keyof ExceptPaymentNumber)[] = ['totalAmount'];

    numericFields.forEach((field) => {
        const value = data[field];
        if (value !== undefined && value !== null && typeof value === 'number' && value < 0) {
            errors.push(`${String(field)} cannot be negative`);
        }
    });


    return {
        isValid: errors.length === 0,
        errors
    };
};



// Helper function to invalidate cache
const invalidateVendorPaymentCache = async (organizationId?: string, vendorId?: string, purchaseId?: string) => {
    try {
        const keysToDelete: string[] = [];

        // Delete all purchase list caches (with different filters)
        const pattern = 'vendorpayment:*';
        const keys = await redisClient.keys(pattern);
        keysToDelete.push(...keys);

        // Delete specific purchase cache if purchaseId provided
        if (purchaseId) {
            keysToDelete.push(`vendorpayment:${purchaseId}`);
        }

        // Delete all keys
        if (keysToDelete.length > 0) {
            await Promise.all(keysToDelete.map(key => redisClient.del(key)));
        }
    } catch (error) {
        console.error("Error invalidating cache:", error);
    }
};


// CREATE Purchase
export const createVendorPayment = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            vendorId,
            projectId,
            organizationId,
            vendorName,
            vendorPaymentDate,
            paymentMode,
            paymentTerms,
            paidThrough,
            items,
            totalAmount = 0,
            notes,
        } = req.body;

        // Validate purchase data
        const validation = validateVendorPaymentData({
            vendorId,
            projectId,
            organizationId, vendorName,
            vendorPaymentDate,
            paymentMode,
            paymentTerms,
            paidThrough, totalAmount, items, notes,
        });

        if (!validation.isValid) {
            res.status(400).json({
                ok: false,
                message: `Validation failed. ${validation.errors[0]}`,
                errors: validation.errors
            });
            return;
        }

        // Calculate item totals
        // const processedItems = items.map((item: any) => ({
        //     ...item,
        //     totalCost: (item.quantity || 0) * (item.rate || 0)
        // }));

        // Calculate purchase totals
        const totals = calculateVendorPaymentTotals(
            items,
        );

        // Create purchase object
        const newPurchase = new VendorPaymentAccountModel({
            organizationId,
            projectId: projectId || null,
            vendorId: vendorId || null,
            vendorName: vendorName?.trim(),
            vendorPaymentDate,
            paymentMode,
            paidThrough,
            items,
            totalAmount: totals.totalAmount,
            notes: notes || null
        });


        await newPurchase.save();
        // Save to database
        // const savedPurchase = await newPurchase.save();

        // We use the utility here because it handles Generating the Unique Record ID
        await syncAccountingRecord({
            organizationId: newPurchase.organizationId,
            projectId: newPurchase?.projectId || null,

            // Reference Links
            referenceId: newPurchase._id,
            referenceModel: "VendorPaymentModel", // Must match Schema

            deptGeneratedDate: newPurchase?.vendorPaymentDate || null,
            deptNumber: newPurchase?.paymentNumber || null,
            deptDueDate: (newPurchase as any)?.dueDate || null,

            // Categorization
            deptRecordFrom: "Vendor Payment",

            // Person Details
            assoicatedPersonName: newPurchase.vendorName,
            assoicatedPersonId: newPurchase?.vendorId || null,
            assoicatedPersonModel: "VendorAccountModel", // Assuming this is your Vendor Model

            // Financials
            amount: newPurchase?.totalAmount || 0, // Utility takes care of grandTotal logic if passed
            notes: newPurchase?.notes || "",

            // Defaults for Creation
            status: "pending",
            paymentId: null
        });


        // Invalidate related caches
        await invalidateVendorPaymentCache(organizationId, vendorId);

        return res.status(201).json({
            ok: true,
            message: "Vendor created successfully",
            data: newPurchase
        });
    } catch (error: any) {
        console.error("Error creating vendorpayment:", error);
        return res.status(500).json({
            ok: false,
            message: error.message,

            error: "Error creating vendorpayment",
        });
    }
};

// GET All purchases (with optional filters)
export const getVendorPayment = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, vendorId, page = 1, limit = 10, date, search, sortBy = 'createdAt',
            sortOrder = 'desc',
            vendorPaymentToDate,
            vendorPaymentFromDate,
            createdFromDate,
            createdToDate,

        } = req.query;


        // Build cache key based on query parameters
        const cacheKey = `vendorpayment:org:${organizationId || 'all'}:vendor:${vendorId || 'all'}:page:${page}:limit:${limit}:date:${date || 'all'}:search${search || "all"}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:vendorPaymentFromDate:${vendorPaymentFromDate || "all"}:vendorPaymentFromDate:${vendorPaymentFromDate || "all"}:sort:${sortBy || "all"}:${sortOrder || "desc"}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Build filter object
        const filter: any = {};

        if (organizationId) {
            if (!mongoose.Types.ObjectId.isValid(organizationId as string)) {
                res.status(400).json({
                    ok: false,
                    message: "Invalid organization ID format"
                });
                return;
            }
            filter.organizationId = new mongoose.Types.ObjectId(organizationId as string);
        }

        if (vendorId) {
            if (!mongoose.Types.ObjectId.isValid(vendorId as string)) {
                res.status(400).json({
                    ok: false,
                    message: "Invalid vendor ID format"
                });
                return;
            }
            filter.vendorId = new mongoose.Types.ObjectId(vendorId as string);
        }



        if (createdFromDate || createdToDate) {
            const filterRange: any = {};

            if (createdFromDate) {
                const from = new Date(createdFromDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid createdFromDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (createdToDate) {
                const to = new Date(createdToDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid createdToDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.createdAt = filterRange;
        }



        if (vendorPaymentToDate || vendorPaymentFromDate) {
            const filterRange: any = {};

            if (vendorPaymentFromDate) {
                const from = new Date(vendorPaymentFromDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid vendorPaymentFromDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (vendorPaymentToDate) {
                const to = new Date(vendorPaymentToDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid vendorPaymentToDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.vendorPaymentDate = filterRange;
        }




        // ✅ Filter by single date (createdAt)
        // if (date) {
        //     const selectedDate = new Date(date as string);
        //     if (isNaN(selectedDate.getTime())) {
        //         res.status(400).json({
        //             ok: false,
        //             message: "Invalid date format. Use ISO string (e.g. 2025-10-23)."
        //         });
        //         return;
        //     }

        //     // Create a range covering the entire day
        //     const startOfDay = new Date(selectedDate);
        //     startOfDay.setHours(0, 0, 0, 0);

        //     const endOfDay = new Date(selectedDate);
        //     endOfDay.setHours(23, 59, 59, 999);

        //     filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        // }

        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { paymentNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;


        // Calculate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Get purchases with pagination
        const [purchase, totalCount] = await Promise.all([
            VendorPaymentAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            VendorPaymentAccountModel.countDocuments(filter)
        ])


        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;



        const response = {
            ok: true,
            message: "vendor payment retrieved successfully",
            data: purchase,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage,
                hasPrevPage,
            }
        };



        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });
        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting purchase:", error);
        res.status(500).json({
            ok: false,
            message: error.message,
            error: "Error retrieving purchase",
        });
    }
};

// GET Single purchase by ID
export const getVendorPaymentById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid ID format"
            });
            return;
        }

        // Build cache key
        const cacheKey = `vendorpayment:${id}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const purchase = await VendorPaymentAccountModel.findById(id)
        // .populate('vendorId', 'name email phone')
        // .populate('organizationId', 'name');

        if (!purchase) {
            res.status(404).json({
                ok: false,
                message: "vendor payment not found"
            });
            return;
        }

        const response = {
            ok: true,
            message: "vendor payment retrieved successfully",
            data: purchase
        };

        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });

        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting vendor payment:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving vendor payment",
            error: error.message
        });
    }
};

// UPDATE purchase
export const updatepurchase = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid purchase ID format"
            });
            return;
        }

        // Check if purchase exists
        const existingpurchase = await VendorPaymentAccountModel.findById(id);
        if (!existingpurchase) {
            res.status(404).json({
                ok: false,
                message: "purchase not found"
            });
            return;
        }

        // Validate update data
        const validation = validateVendorPaymentData({
            ...existingpurchase.toObject(),
            ...updateData
        });

        if (!validation.isValid) {
            return res.status(400).json({
                ok: false,
                message: `Validation failed. ${validation.errors[0]}`,
                errors: validation.errors
            });

        }

        // If items are being updated, recalculate totals
        if (updateData.items) {
            const processedItems = updateData.items.map((item: any) => ({
                ...item,
                totalCost: (item.quantity || 0) * (item.rate || 0)
            }));

            const totals = calculateVendorPaymentTotals(
                processedItems,
                // updateData.discountPercentage ?? existingpurchase.discountPercentage ?? 0,
                // updateData.taxPercentage ?? existingpurchase.taxPercentage ?? 0
            );

            updateData.items = processedItems;
            updateData.totalAmount = totals.totalAmount;
            // updateData.discountAmount = totals.discountAmount;
            // updateData.taxAmount = totals.taxAmount;
            // updateData.grandTotal = totals.grandTotal;
        } else if (updateData.discountPercentage !== undefined || updateData.taxPercentage !== undefined) {
            // Recalculate if discount or tax percentage changed
            const totals = calculateVendorPaymentTotals(
                existingpurchase.items,
                //     updateData.discountPercentage ?? existingpurchase.discountPercentage ?? 0,
                //     updateData.taxPercentage ?? existingpurchase.taxPercentage ?? 0
            );

            updateData.totalAmount = totals.totalAmount;
            // updateData.discountAmount = totals.discountAmount;
            // updateData.taxAmount = totals.taxAmount;
            // updateData.grandTotal = totals.grandTotal;
        }

        // Update purchase
        const updatedpurchase = await VendorPaymentAccountModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )

        if (!updatedpurchase) {
            return res.status(400).json({
                ok: false,
                message: `vendor purchase order not found`,
            });
        }


        const isExiting = await AccountingModel.findOneAndUpdate(
            {
                referenceId: updatedpurchase._id,
                referenceModel: "VendorPaymentModel"
            },
            {
                $set: {
                    // Update fields that might have changed in the bill
                    amount: updatedpurchase.totalAmount,
                    notes: updatedpurchase.notes,
                    projectId: updatedpurchase?.projectId || null,
                    assoicatedPersonName: updatedpurchase.vendorName,

                    deptGeneratedDate: updatedpurchase?.vendorPaymentDate || null,
                    deptNumber: updatedpurchase?.paymentNumber || "VEN-PAY-2025-001",
                    deptDueDate: (updatedpurchase as any)?.dueDate || null,

                    // Optional: Update person ID if vendor changed
                    assoicatedPersonId: updatedpurchase?.vendorId || null,
                    // IMPORTANT: We DO NOT include 'status' or 'paymentId' here.
                    // Those are controlled by the Payment Controller.
                }
            },
            { new: true }
        );


        await invalidateVendorPaymentCache((updatedpurchase as any).organizationId, id);


        return res.status(200).json({
            ok: true,
            message: "purchase updated successfully",
            data: updatedpurchase
        });
    } catch (error: any) {
        console.error("Error updating purchase:", error);
        res.status(500).json({
            ok: false,
            message: "Error updating purchase",
            error: error.message
        });
    }
};

// DELETE purchase



export const deleteVendorPayment = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid ID format"
            });
        }

        const deletedpurchase = await VendorPaymentAccountModel.findByIdAndDelete(id);

        if (!deletedpurchase) {
            return res.status(404).json({
                ok: false,
                message: "vendor payment not found"
            });

        }


        // Invalidate related caches
        await invalidateVendorPaymentCache(
            deletedpurchase.organizationId?.toString(),
            deletedpurchase.vendorId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "vendor payment deleted successfully",
            data: deletedpurchase
        });
    } catch (error: any) {
        console.error("Error deleting vendor payment:", error);
        res.status(500).json({
            ok: false,
            error: "Error deleting vendor payment",
            message: error.message,
        });
    }
};



export const sendVendorPaymentToPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { vendorId } = req.params; // We expect the Bill ID to be sent

        // 1. Validate Bill ID
        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid ID format"
            });
        }

        // 2. Fetch the Bill
        const vendorPay = await VendorPaymentAccountModel.findById(vendorId);
        if (!vendorPay) {
            return res.status(404).json({
                ok: false,
                message: "Vendor Payment Order not found"
            });
        }


        if (vendorPay?.isSyncWithPaymentsSection) {
            return res.status(400).json({ message: "Vendor Payment Already sent to the payment section", ok: false })
        }


        const paymentItems = vendorPay.items.map((item: IVendorPaymentItems, index: number) => {

            return {
                itemName: item.itemName,
                quantity: 1,
                rate: item.billAmount,
                unit: "nos",
                totalCost: item.billAmount,
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
            paymentPersonId: vendorPay.vendorId || null,
            paymentPersonModel: vendorPay?.vendorId ? "VendorAccountModel" : null,
            paymentPersonName: vendorPay?.vendorName || "",
            organizationId: vendorPay.organizationId,
            accountingRef: null,
            projectId: vendorPay?.projectId as Types.ObjectId || null,
            fromSectionModel: "VendorPaymentModel",
            fromSectionId: vendorPay._id as Types.ObjectId,
            fromSection: "Vendor Payment",
            fromSectionNumber: vendorPay.paymentNumber,
            paymentDate: null,
            dueDate: (vendorPay as any)?.dueDate || null,
            subject: "",
            items: paymentItems,
            totalAmount: vendorPay.totalAmount || 0,
            discountPercentage:  0,
            discountAmount:  0,
            taxPercentage: 0,
            taxAmount:  0,
            grandTotal: vendorPay?.totalAmount,
            paymentType: vendorPay.paymentTerms,
            advancedAmount: {
                totalAmount:  0,
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
                totalAmount: vendorPay.totalAmount,
                status: 'pending',
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: null,
                fees: null,
                tax: null,
            },

            notes: vendorPay?.notes || null,
            isSyncedWithAccounting: false,
            generalStatus: "pending"
        })

        vendorPay.isSyncWithPaymentsSection = true;
        await vendorPay.save()




        await invalidateVendorPaymentCache((vendorPay as any).organizationId, vendorId);



        return res.status(201).json({
            ok: true,
            message: "Sent to Payments Section successfully",
            data: newPayemnt
        });

    } catch (error: any) {
        console.error("Error sending bill to payement:", error);
        return res.status(500).json({
            ok: false,
            message: "Error processing request",
            error: error.message
        });
    }
}