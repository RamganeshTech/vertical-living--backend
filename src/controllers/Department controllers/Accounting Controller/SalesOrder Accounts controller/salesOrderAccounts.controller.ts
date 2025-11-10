import { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../../../../types/types";
import redisClient from "../../../../config/redisClient";
import { SalesAccountModel } from "../../../../models/Department Models/Accounting Model/salesOrder.model";

// // Helper function to generate unique invoice number
// const generateInvoiceNumber = async (organizationId: string): Promise<string> => {
//     try {
//         const orgId = organizationId.toString();

//         // Get all invoices for this organization
//         const invoices = await SalesAccountModel.find(
//             { organizationId: new mongoose.Types.ObjectId(orgId) },
//             { invoiceNumber: 1 }
//         ).lean();
// console.log("invoices", invoices)
//         if (invoices.length === 0) {
//             return `INV-${orgId.slice(0, 5)}-1`;
//         }

//         // Extract the unique numbers from all invoice numbers
//         const numbers = invoices
//             .map(invoice => {
//                 if (!invoice.invoiceNumber) return 0;
//                 const parts = invoice.invoiceNumber.split('-');
//                 const lastPart = parts[parts.length - 1];
//                 return parseInt(lastPart) || 0;
//             })
//             .filter(num => num > 0);

//         // Find the maximum number
//         const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

//         // Return new invoice number with incremented value
//         return `INV-${orgId.slice(0, 5)}-${maxNumber + 1}`;
//     } catch (error) {
//         throw new Error("Error generating invoice number");
//     }
// };

// Helper function to calculate invoice totals
const calculateSalesTotals = (
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
const validateSaleData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check mandatory fields
    if (!data.customerName || data.customerName.trim() === '') {
        errors.push("Customer name is required");
    }


    if (data.salesOrderDate && isNaN(new Date(data.salesOrderDate).getTime())) {
        errors.push("salesOrder Date is invalid")
    }

    if (data.expectedShipmentDate && isNaN(new Date(data.expectedShipmentDate).getTime())) {
        errors.push("expectedShipment Date is invalid")
    }

    // if (!data.customerId) {
    //     errors.push("Customer ID is required");
    // }

    if (!data.organizationId) {
        errors.push("Organization ID is required");
    }

    // Validate customerId format
    if (data.customerId && !mongoose.Types.ObjectId.isValid(data.customerId)) {
        errors.push("Invalid customer ID format");
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
const invalidateInvoiceCache = async (organizationId?: string, customerId?: string, invoiceId?: string) => {
    try {
        const keysToDelete: string[] = [];

        // Delete all invoice list caches (with different filters)
        const pattern = 'salesorder:*';
        const keys = await redisClient.keys(pattern);
        keysToDelete.push(...keys);

        // Delete specific invoice cache if invoiceId provided
        if (invoiceId) {
            keysToDelete.push(`salesorder:${invoiceId}`);
        }

        // Delete all keys
        if (keysToDelete.length > 0) {
            await Promise.all(keysToDelete.map(key => redisClient.del(key)));
        }
    } catch (error) {
        console.error("Error invalidating cache:", error);
    }
};


// CREATE Invoice
export const createSalesOrder = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            customerId,
            organizationId,
            customerName,
            salesOrderDate,
            expectedShipmentDate,
            salesPerson,
            subject,
            items,
            totalAmount,
            discountPercentage,
            discountAmount,
            taxPercentage,
            taxAmount,
            grandTotal,
            customerNotes,
            termsAndConditions } = req.body;

        // Validate invoice data
        const validation = validateSaleData({
            customerId, organizationId, customerName, salesPerson,
            salesOrderDate,
            expectedShipmentDate,
            subject, items, totalAmount, discountPercentage, discountAmount,
            taxPercentage, taxAmount, grandTotal, customerNotes, termsAndConditions
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

        // Calculate salesorder totals
        const totals = calculateSalesTotals(
            processedItems,
            discountPercentage || 0,
            taxPercentage || 0
        );

        // Generate unique salesorder number
        // const salesorderNumber = await generatesalesorderNumber(organizationId);

        // Create salesorder object
        const newsalesorder = await SalesAccountModel.create({
            organizationId,
            customerId: customerId || null,
            customerName: customerName?.trim(),
            // orderNumber: orderNumber || null,
            // accountsReceivable: accountsReceivable || null,
            salesOrderDate,
            expectedShipmentDate,
            salesPerson: salesPerson || null,
            subject: subject || null,

            items: processedItems,
            totalAmount: totals.totalAmount,
            discountPercentage,
            discountAmount: totals.discountAmount,
            taxPercentage,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            customerNotes: customerNotes || null,
            termsAndConditions: termsAndConditions || null
        });

        // Save to database
        // const savedInvoice = await newInvoice.save();

        // Invalidate related caches
        await invalidateInvoiceCache(organizationId, customerId);

        return res.status(201).json({
            ok: true,
            message: "salesorder created successfully",
            data: newsalesorder
        });
    } catch (error: any) {
        console.error("Error creating invoice:", error);
        return res.status(500).json({
            ok: false,
            message: "Error creating invoice",
            error: error.message
        });
    }
};

// GET All Invoices (with optional filters)
export const getSalesorder = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, customerId, page = 1, limit = 10, search, sortBy = 'createdAt',
            sortOrder = 'desc', 
            fromSalesOrderDate, toSalesOrderDate ,  createdFromDate,
            createdToDate,} = req.query;


        // Build cache key based on query parameters
        const cacheKey = `salesorder:org:${organizationId || 'all'}:customer:${customerId || 'all'}:page:${page}:limit:${limit}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:fromSalesOrderDate:${fromSalesOrderDate || "all"}:toSalesOrderDate:${toSalesOrderDate || "all"}:search${search || "all"}:${sortBy}:${sortOrder}`;

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

        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
                res.status(400).json({
                    ok: false,
                    message: "Invalid customer ID format"
                });
                return;
            }
            filter.customerId = new mongoose.Types.ObjectId(customerId as string);
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

        // if (salesOrderDate) {
        //     const selectedsalesOrderDate = new Date(salesOrderDate as string);
        //     if (isNaN(selectedsalesOrderDate.getTime())) {
        //         res.status(400).json({
        //             ok: false,
        //             message: "Invalid salesOrderDate format. Use ISO string (e.g. 2025-10-23)."
        //         });
        //         return;
        //     }

        //     // Create a range covering the entire day
        //     const startOfDay = new Date(selectedsalesOrderDate);
        //     startOfDay.setHours(0, 0, 0, 0);

        //     const endOfDay = new Date(selectedsalesOrderDate);
        //     endOfDay.setHours(23, 59, 59, 999);

        //     filter.salesOrderDate = { $gte: startOfDay, $lte: endOfDay };
        // }


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



        if (fromSalesOrderDate || toSalesOrderDate) {
            const filterRange: any = {};

            if (fromSalesOrderDate) {
                const from = new Date(fromSalesOrderDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid fromSalesOrderDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (toSalesOrderDate) {
                const to = new Date(toSalesOrderDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid toSalesOrderDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.salesOrderDate = filterRange;
        }


        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
            ];
        }

         // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;


        // Calculate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Get invoices with pagination
        const [sales, total] = await Promise.all([
            SalesAccountModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            SalesAccountModel.countDocuments(filter)
        ])


        const response = {
            ok: true,
            message: "Sales order retrieved successfully",
            data: sales,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        };



        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });
        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting salesorder:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving salesorder",
            error: error.message
        });
    }
};

// GET Single Invoice by ID
export const getSalesorderById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid salesorder ID format"
            });
            return;
        }

        // Build cache key
        const cacheKey = `salesorder:${id}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const salesorder = await SalesAccountModel.findById(id)
        // .populate('customerId', 'name email phone')
        // .populate('organizationId', 'name');

        if (!salesorder) {
            res.status(404).json({
                ok: false,
                message: "salesorder not found"
            });
            return;
        }

        const response = {
            ok: true,
            message: "Salesorder retrieved successfully",
            data: salesorder
        };

        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });

        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting salesorder:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving salesorder",
            error: error.message
        });
    }
};

// UPDATE salesorder
// export const updatesalesorder = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;
//         const updateData = req.body;

//         // Validate ID format
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             res.status(400).json({
//                 ok: false,
//                 message: "Invalid salesorder ID format"
//             });
//             return;
//         }

//         // Check if salesorder exists
//         const existingsalesorder = await SalesAccountModel.findById(id);
//         if (!existingsalesorder) {
//             res.status(404).json({
//                 ok: false,
//                 message: "salesorder not found"
//             });
//             return;
//         }

//         // Validate update data
//         const validation = validatesalesorderData({
//             ...existingsalesorder.toObject(),
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

//             const totals = calculatesalesorderTotals(
//                 processedItems,
//                 updateData.discountPercentage ?? existingsalesorder.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingsalesorder.taxPercentage ?? 0
//             );

//             updateData.items = processedItems;
//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         } else if (updateData.discountPercentage !== undefined || updateData.taxPercentage !== undefined) {
//             // Recalculate if discount or tax percentage changed
//             const totals = calculatesalesorderTotals(
//                 existingsalesorder.items,
//                 updateData.discountPercentage ?? existingsalesorder.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingsalesorder.taxPercentage ?? 0
//             );

//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         }

//         // Update salesorder
//         const updatedsalesorder = await SalesAccountModel.findByIdAndUpdate(
//             id,
//             updateData,
//             { new: true, runValidators: true }
//         ).populate('customerId', 'name email')
//             .populate('organizationId', 'name');

//         res.status(200).json({
//             ok: true,
//             message: "salesorder updated successfully",
//             data: updatedsalesorder
//         });
//     } catch (error: any) {
//         console.error("Error updating salesorder:", error);
//         res.status(500).json({
//             ok: false,
//             message: "Error updating salesorder",
//             error: error.message
//         });
//     }
// };

// DELETE salesorder



export const deleteSalesorder = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid salesorder ID format"
            });
        }

        const deletedSalesorder = await SalesAccountModel.findByIdAndDelete(id);

        if (!deletedSalesorder) {
            return res.status(404).json({
                ok: false,
                message: "salesorder not found"
            });

        }


        // Invalidate related caches
        await invalidateInvoiceCache(
            deletedSalesorder.organizationId?.toString(),
            deletedSalesorder.customerId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "salesorder deleted successfully",
            data: deletedSalesorder
        });
    } catch (error: any) {
        console.error("Error deleting salesorder:", error);
        res.status(500).json({
            ok: false,
            message: "Error deleting salesorder",
            error: error.message
        });
    }
};