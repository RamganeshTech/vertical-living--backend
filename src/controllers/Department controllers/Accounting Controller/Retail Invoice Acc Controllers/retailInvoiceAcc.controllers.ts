import { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../../../../types/types";
import redisClient from "../../../../config/redisClient";
import { RetailInvoiceAccountModel } from "../../../../models/Department Models/Accounting Model/retailInvoice.model";

// Helper function to generate unique invoice number
const generateInvoiceNumber = async (organizationId: string): Promise<string> => {
    try {
        const orgId = organizationId.toString();

        // Get all invoices for this organization
        const invoices = await RetailInvoiceAccountModel.find(
            { organizationId: new mongoose.Types.ObjectId(orgId) },
            { invoiceNumber: 1 }
        ).lean();
// console.log("invoices", invoices)
        if (invoices.length === 0) {
            return `INV-${orgId.slice(0, 5)}-1`;
        }

        // Extract the unique numbers from all invoice numbers
        const numbers = invoices
            .map(invoice => {
                if (!invoice.invoiceNumber) return 0;
                const parts = invoice.invoiceNumber.split('-');
                const lastPart = parts[parts.length - 1];
                return parseInt(lastPart) || 0;
            })
            .filter(num => num > 0);

        // Find the maximum number
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

        // Return new invoice number with incremented value
        return `INV-${orgId.slice(0, 5)}-${maxNumber + 1}`;
    } catch (error) {
        throw new Error("Error generating invoice number");
    }
};

// Helper function to calculate invoice totals
const calculateInvoiceTotals = (
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
const validateInvoiceData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check mandatory fields
    if (!data.customerName || data.customerName.trim() === '') {
        errors.push("Customer name is required");
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
        const pattern = 'retailinvoices:*';
        const keys = await redisClient.keys(pattern);
        keysToDelete.push(...keys);

        // Delete specific invoice cache if invoiceId provided
        if (invoiceId) {
            keysToDelete.push(`retailinvoice:${invoiceId}`);
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
export const createRetailInvoice = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            customerId,
            organizationId,
            customerName,
            salesPerson,
            subject,
            invoiceDate,
            items,
            totalAmount,
            discountPercentage,
            discountAmount,
            taxPercentage,
            taxAmount,
            grandTotal,
            } = req.body;

        // Validate invoice data
        const validation = validateInvoiceData({
            customerId, organizationId, customerName, salesPerson,
            subject, invoiceDate,  items, totalAmount, discountPercentage, discountAmount,
            taxPercentage, taxAmount, grandTotal
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

        // Calculate invoice totals
        const totals = calculateInvoiceTotals(
            processedItems,
            discountPercentage || 0,
            taxPercentage || 0
        );

        // Generate unique invoice number
        const invoiceNumber = await generateInvoiceNumber(organizationId);

        // Create invoice object
        const newInvoice = await RetailInvoiceAccountModel.create({
            organizationId,
            customerId: customerId || null,
            customerName: customerName?.trim(),
            salesPerson: salesPerson || null,
            subject: subject || null,
            invoiceDate,
            invoiceNumber,
            items: processedItems,
            totalAmount: totals.totalAmount,
            discountPercentage,
            discountAmount: totals.discountAmount,
            taxPercentage,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
        });

        // Save to database
        // const savedInvoice = await newInvoice.save();

        // Invalidate related caches
        await invalidateInvoiceCache(organizationId, customerId);

        return res.status(201).json({
            ok: true,
            message: "Retail Invoice created successfully",
            data: newInvoice
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
export const getRetailInvoices = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, customerId, page = 1, limit = 10, date, search, sortBy = 'createdAt',
            sortOrder = 'desc', 
        fromInvoiceDate,
            toInvoiceDate,
            createdFromDate,
            createdToDate,
        } = req.query;


        // Build cache key based on query parameters
        const cacheKey = `retailinvoices:org:${organizationId || 'all'}:customer:${customerId || 'all'}:page:${page}:limit:${limit}:search${search || "all"}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:fromInvoiceDate:${fromInvoiceDate || "all"}:toInvoiceDate:${toInvoiceDate || "all"}:sort:${sortBy}:${sortOrder}`;

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



        if (fromInvoiceDate || toInvoiceDate) {
            const filterRange: any = {};

            if (fromInvoiceDate) {
                const from = new Date(fromInvoiceDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid fromInvoiceDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (toInvoiceDate) {
                const to = new Date(toInvoiceDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid toInvoiceDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.invoiceDate = filterRange;
        }



        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { invoiceNumber: { $regex: search, $options: 'i' } },
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
        const [invoices, total] = await Promise.all([
            RetailInvoiceAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            RetailInvoiceAccountModel.countDocuments(filter)
        ])


        const response = {
            ok: true,
            message: "Retail Invoices retrieved successfully",
            data: invoices,
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
        console.error("Error getting retail invoices:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving invoices",
            error: error.message
        });
    }
};

// GET Single Invoice by ID
export const getRetailInvoiceById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid invoice ID format"
            });
            return;
        }

            // Build cache key
        const cacheKey = `retailinvoice:${id}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const invoice = await RetailInvoiceAccountModel.findById(id)
        // .populate('customerId', 'name email phone')
        // .populate('organizationId', 'name');

        if (!invoice) {
            res.status(404).json({
                ok: false,
                message: "Invoice not found"
            });
            return;
        }

        const response = {
            ok: true,
            message: "Invoice retrieved successfully",
            data: invoice
        };

        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });

        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting invoice:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving invoice",
            error: error.message
        });
    }
};

// UPDATE Invoice
// export const updateInvoice = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;
//         const updateData = req.body;

//         // Validate ID format
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             res.status(400).json({
//                 ok: false,
//                 message: "Invalid invoice ID format"
//             });
//             return;
//         }

//         // Check if invoice exists
//         const existingInvoice = await RetailInvoiceAccountModel.findById(id);
//         if (!existingInvoice) {
//             res.status(404).json({
//                 ok: false,
//                 message: "Invoice not found"
//             });
//             return;
//         }

//         // Validate update data
//         const validation = validateInvoiceData({
//             ...existingInvoice.toObject(),
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

//             const totals = calculateInvoiceTotals(
//                 processedItems,
//                 updateData.discountPercentage ?? existingInvoice.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingInvoice.taxPercentage ?? 0
//             );

//             updateData.items = processedItems;
//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         } else if (updateData.discountPercentage !== undefined || updateData.taxPercentage !== undefined) {
//             // Recalculate if discount or tax percentage changed
//             const totals = calculateInvoiceTotals(
//                 existingInvoice.items,
//                 updateData.discountPercentage ?? existingInvoice.discountPercentage ?? 0,
//                 updateData.taxPercentage ?? existingInvoice.taxPercentage ?? 0
//             );

//             updateData.totalAmount = totals.totalAmount;
//             updateData.discountAmount = totals.discountAmount;
//             updateData.taxAmount = totals.taxAmount;
//             updateData.grandTotal = totals.grandTotal;
//         }

//         // Update invoice
//         const updatedInvoice = await RetailInvoiceAccountModel.findByIdAndUpdate(
//             id,
//             updateData,
//             { new: true, runValidators: true }
//         ).populate('customerId', 'name email')
//             .populate('organizationId', 'name');

//         res.status(200).json({
//             ok: true,
//             message: "Invoice updated successfully",
//             data: updatedInvoice
//         });
//     } catch (error: any) {
//         console.error("Error updating invoice:", error);
//         res.status(500).json({
//             ok: false,
//             message: "Error updating invoice",
//             error: error.message
//         });
//     }
// };

// DELETE Invoice



export const deleteRetailInvoice = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
           return res.status(400).json({
                ok: false,
                message: "Invalid invoice ID format"
            });
        }

        const deletedInvoice = await RetailInvoiceAccountModel.findByIdAndDelete(id);

        if (!deletedInvoice) {
           return res.status(404).json({
                ok: false,
                message: "Invoice not found"
            });
            
        }


         // Invalidate related caches
        await invalidateInvoiceCache(
            deletedInvoice.organizationId?.toString(),
            deletedInvoice.customerId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "Invoice deleted successfully",
            data: deletedInvoice
        });
    } catch (error: any) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({
            ok: false,
            message: "Error deleting invoice",
            error: error.message
        });
    }
};