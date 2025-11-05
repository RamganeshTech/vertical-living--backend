import { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../../../../types/types";
import redisClient from "../../../../config/redisClient";
import { PurchaseAccountModel } from "../../../../models/Department Models/Accounting Model/purchase.model";

// Helper function to generate unique purchase number
// Helper function to calculate purchase totals
const calculatePurchaseTotals = (
    items: any[],
    discountPercentage: number = 0,
    taxPercentage: number = 0
) => {
    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
        return sum + (item.totalCost || 0);
    }, 0);

    // Calculate discount amount
    const discountAmount = (totalAmount * discountPercentage) / 100;

    // Calculate amount after discount
    const amountAfterDiscount = totalAmount - discountAmount;

    // Calculate tax amount on the discounted amount
    const taxAmount = (amountAfterDiscount * taxPercentage) / 100;

    // Calculate grand total
    const grandTotal = amountAfterDiscount + taxAmount;

    return {
        totalAmount,
        discountAmount,
        taxAmount,
        grandTotal
    };
};

// Manual validation function
const validatePurchaseData = (data: any): { isValid: boolean; errors: string[] } => {
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



    if (data?.items && Array.isArray(data.isArray) && data?.items?.length > 0) {
        data.items.forEach((item: any, index: number) => {
            if (!item.itemName || item.itemName.trim() === '') {
                errors.push(`Item ${index + 1}: Item name is required`);
            }

            if (item.rate === undefined || item.rate === null) {
                errors.push(`Item ${index + 1}: Rate is required`);
            }

            if (typeof item.rate === 'number' && item.rate < 0) {
                errors.push(`Item ${index + 1}: Rate cannot be negative`);
            }

            if (typeof item.quantity === 'number' && item.quantity < 0) {
                errors.push(`Item ${index + 1}: Quantity cannot be negative`);
            }

            if (typeof item.totalCost === 'number' && item.totalCost < 0) {
                errors.push(`Item ${index + 1}: Total cost cannot be negative`);
            }
        });
    }

    // Validate numeric fields are not negative
    const numericFields = [
        'totalAmount', 'discountPercentage', 'discountAmount',
        'taxPercentage', 'taxAmount', 'grandTotal'
    ];

    numericFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null && typeof data[field] === 'number' && data[field] < 0) {
            errors.push(`${field} cannot be negative`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};



// Helper function to invalidate cache
const invalidatePurchaseCache = async (organizationId?: string, vendorId?: string, purchaseId?: string) => {
    try {
        const keysToDelete: string[] = [];

        // Delete all purchase list caches (with different filters)
        const pattern = 'purchaseaccount:*';
        const keys = await redisClient.keys(pattern);
        keysToDelete.push(...keys);

        // Delete specific purchase cache if purchaseId provided
        if (purchaseId) {
            keysToDelete.push(`purchaseaccount:${purchaseId}`);
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
export const createPurchase = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            vendorId,
            organizationId,
            vendorName,
            deliveryAddress,
            purchaseDate,
            deliveryDate,
            items,
            totalAmount = 0,
            discountPercentage = 0,
            // discountAmount,
            taxPercentage = 0,
            // taxAmount,
            // grandTotal,
            notes } = req.body;

        // Validate purchase data
        const validation = validatePurchaseData({
            vendorId, organizationId, vendorName, deliveryAddress,
            deliveryDate, purchaseDate, items, totalAmount, discountPercentage,
            taxPercentage, notes,
        });

        if (!validation.isValid) {
            res.status(400).json({
                ok: false,
                message: "Validation failed",
                errors: validation.errors
            });
            return;
        }

        // Calculate item totals
        const processedItems = items.map((item: any) => ({
            ...item,
            totalCost: (item.quantity || 0) * (item.rate || 0)
        }));

        // Calculate purchase totals
        const totals = calculatePurchaseTotals(
            processedItems,
            discountPercentage || 0,
            taxPercentage || 0
        );

        // Create purchase object
        const newPurchase = await PurchaseAccountModel.create({
            organizationId,
            vendorId: vendorId || null,
            vendorName: vendorName?.trim(),
            purchaseDate,
            deliveryDate: deliveryDate || null,
            deliveryAddress,
            items: processedItems,
            totalAmount: totals.totalAmount,
            discountPercentage,
            discountAmount: totals.discountAmount,
            taxPercentage,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            notes: notes || null
        });

        // Save to database
        // const savedPurchase = await newPurchase.save();

        // Invalidate related caches
        await invalidatePurchaseCache(organizationId, vendorId);

        return res.status(201).json({
            ok: true,
            message: "Purchase created successfully",
            data: newPurchase
        });
    } catch (error: any) {
        console.error("Error creating purchase:", error);
        return res.status(500).json({
            ok: false,
            message: error.message,

            error: "Error creating purchase",
        });
    }
};

// GET All purchases (with optional filters)
export const getPurchases = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, vendorId, page = 1, limit = 10, date, search, sortBy = 'createdAt',
            sortOrder = 'desc' } = req.query;


        // Build cache key based on query parameters
        const cacheKey = `purchaseaccount:org:${organizationId || 'all'}:vendor:${vendorId || 'all'}:page:${page}:limit:${limit}:date:${date || 'all'}:search${search || "all"}:sort:${sortBy || "all"}:${sortOrder || "desc"}`;

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

        // ✅ Filter by single date (createdAt)
        if (date) {
            const selectedDate = new Date(date as string);
            if (isNaN(selectedDate.getTime())) {
                res.status(400).json({
                    ok: false,
                    message: "Invalid date format. Use ISO string (e.g. 2025-10-23)."
                });
                return;
            }

            // Create a range covering the entire day
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { purchaseOrderNumber: { $regex: search, $options: 'i' } },
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
            PurchaseAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            PurchaseAccountModel.countDocuments(filter)
        ])


         // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;



        const response = {
            ok: true,
            message: "Purchase retrieved successfully",
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
export const getPurchaseById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid purchase ID format"
            });
            return;
        }

        // Build cache key
        const cacheKey = `purchaseaccount:${id}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const purchase = await PurchaseAccountModel.findById(id)
        // .populate('vendorId', 'name email phone')
        // .populate('organizationId', 'name');

        if (!purchase) {
            res.status(404).json({
                ok: false,
                message: "purchase not found"
            });
            return;
        }

        const response = {
            ok: true,
            message: "purchase retrieved successfully",
            data: purchase
        };

        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });

        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting purchase:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving purchase",
            error: error.message
        });
    }
};

// UPDATE purchase
// export const updatepurchase = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;
//         const updateData = req.body;

//         // Validate ID format
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             res.status(400).json({
//                 ok: false,
//                 message: "Invalid purchase ID format"
//             });
//             return;
//         }

//         // Check if purchase exists
//         const existingpurchase = await PurchaseAccountModel.findById(id);
//         if (!existingpurchase) {
//             res.status(404).json({
//                 ok: false,
//                 message: "purchase not found"
//             });
//             return;
//         }

//         // Validate update data
//         const validation = validatepurchaseData({
//             ...existingpurchase.toObject(),
//             ...updateData
//         });

//         if (!validation.isValid) {
//             res.status(400).json({
//                 ok: false,
//                 message: "Validation failed",
//                 errors: validation.errors
//             });
//             return;
//         }

//         // If items are being updated, recalculate totals
//         if (updateData.items) {
//             const processedItems = updateData.items.map((item: any) => ({
//                 ...item,
//                 totalCost: (item.quantity || 0) * (item.rate || 0)
//             }));

//             const totals = calculatepurchaseTotals(
//                 processedItems,
//                 updateData.discountPercentage ?? existingpurchase.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingpurchase.taxPercentage ?? 0
//             );

//             updateData.items = processedItems;
//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         } else if (updateData.discountPercentage !== undefined || updateData.taxPercentage !== undefined) {
//             // Recalculate if discount or tax percentage changed
//             const totals = calculatepurchaseTotals(
//                 existingpurchase.items,
//                 updateData.discountPercentage ?? existingpurchase.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingpurchase.taxPercentage ?? 0
//             );

//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         }

//         // Update purchase
//         const updatedpurchase = await PurchaseAccountModel.findByIdAndUpdate(
//             id,
//             updateData,
//             { new: true, runValidators: true }
//         ).populate('vendorId', 'name email')
//             .populate('organizationId', 'name');

//         res.status(200).json({
//             ok: true,
//             message: "purchase updated successfully",
//             data: updatedpurchase
//         });
//     } catch (error: any) {
//         console.error("Error updating purchase:", error);
//         res.status(500).json({
//             ok: false,
//             message: "Error updating purchase",
//             error: error.message
//         });
//     }
// };

// DELETE purchase



export const deletePurchase = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid purchase ID format"
            });
        }

        const deletedpurchase = await PurchaseAccountModel.findByIdAndDelete(id);

        if (!deletedpurchase) {
            return res.status(404).json({
                ok: false,
                message: "purchase not found"
            });

        }


        // Invalidate related caches
        await invalidatePurchaseCache(
            deletedpurchase.organizationId?.toString(),
            deletedpurchase.vendorId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "purchase deleted successfully",
            data: deletedpurchase
        });
    } catch (error: any) {
        console.error("Error deleting purchase:", error);
        res.status(500).json({
            ok: false,
            error: "Error deleting purchase",
            message: error.message,
        });
    }
};