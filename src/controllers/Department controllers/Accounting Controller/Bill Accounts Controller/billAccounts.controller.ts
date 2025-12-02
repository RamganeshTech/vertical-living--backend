import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { RoleBasedRequest } from "../../../../types/types";
import redisClient from "../../../../config/redisClient";
import { BillAccountModel } from "../../../../models/Department Models/Accounting Model/billAccount.model";
import { COMPANY_LOGO, uploadToS3 } from "../../../stage controllers/ordering material controller/pdfOrderHistory.controller";
import { generateBillAccBillPdf } from "./pdfBillAcc";
import { AccountingModel } from "../../../../models/Department Models/Accounting Model/accountingMain.model";
import { generateTransactionNumber, syncAccountingRecord } from "../accounting.controller";
import { PaymentMainAccountModel } from "../../../../models/Department Models/Accounting Model/paymentMainAcc.model";
import { createPaymentMainAccUtil } from "../PaymentMainAcc_controllers/paymentMainAcc.controller";

// Helper function to generate unique bill number
// Helper function to calculate bill totals
const calculateBillTotals = (
    items: any[],
    discountPercentage: number = 0,
    taxPercentage: number = 0,
    advancedAmount: number = 0,
    paymentType: string = ""
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
    let grandTotal = amountAfterDiscount + taxAmount;


    if (paymentType === "pay advanced, balance later") {
        const advance = advancedAmount || 0;
        grandTotal = Math.max(0, grandTotal - advance); // Prevent negative
    }


    return {
        totalAmount,
        discountAmount,
        taxAmount,
        grandTotal
    };
};

// Manual validation function
const validateBillData = (data: any): { isValid: boolean; errors: string[] } => {
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


            if (typeof item.unit !== "string") {
                errors.push(`Item ${index + 1}: unit must be atleast empty string`);
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
const invalidateBillCache = async (organizationId?: string, vendorId?: string, billId?: string) => {
    try {
        const keysToDelete: string[] = [];

        // Delete all bill list caches (with different filters)
        const pattern = 'billaccount:*';
        const keys = await redisClient.keys(pattern);
        keysToDelete.push(...keys);

        // Delete specific bill cache if billId provided
        if (billId) {
            keysToDelete.push(`billaccount:${billId}`);
        }

        // Delete all keys
        if (keysToDelete.length > 0) {
            await Promise.all(keysToDelete.map(key => redisClient.del(key)));
        }
    } catch (error) {
        console.error("Error invalidating cache:", error);
    }
};


const parseBodyData = (body: any) => {
    const parsed = { ...body };

    // Parse Items if stringified
    if (typeof parsed.items === 'string') {
        try {
            parsed.items = JSON.parse(parsed.items);
        } catch (e) {
            parsed.items = [];
        }
    }

    // Convert numeric strings to numbers
    ['totalAmount', 'discountPercentage', 'taxPercentage'].forEach(field => {
        if (parsed[field]) parsed[field] = Number(parsed[field]);
    });

    return parsed;
};


// CREATE Bill
export const createBill = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const bodyData = parseBodyData(req.body);


        const {
            vendorId = null,
            organizationId,
            projectId,
            vendorName,
            accountsPayable,
            subject,
            billDate,
            dueDate,
            items,
            totalAmount,
            discountPercentage,
            advancedAmount,
            paymentType,
            // taxAmount,
            // discountAmount,
            taxPercentage,
            // grandTotal,
            notes } = bodyData;

        // Validate bill data
        const validation = validateBillData({
            vendorId, organizationId, vendorName, accountsPayable,
            subject, dueDate, billDate, items, totalAmount, discountPercentage,
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
            totalCost: (Number(item.quantity) || 0) * (Number(item.rate) || 0)
        }));


        // Calculate bill totals
        const totals = calculateBillTotals(

            processedItems,
            discountPercentage || 0,
            taxPercentage || 0,
            advancedAmount || 0,
            paymentType

        );


        const files = req.files as (Express.Multer.File & { location: string })[];

        const mappedFiles: any[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        // Create bill object
        const newBill = await BillAccountModel.create({
            organizationId,
            projectId: projectId || null,
            vendorId: vendorId || null,
            vendorName: vendorName?.trim(),
            accountsPayable,
            subject: subject || null,
            billDate,
            dueDate,
            items: processedItems,
            totalAmount: totals.totalAmount,
            paymentType,
            advancedAmount,
            discountPercentage,
            discountAmount: totals.discountAmount,
            taxPercentage,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            notes: notes || null,
            images: mappedFiles || [],
            isSyncedWithAccounting: true,
            pdfData: null,
        });

        // Save to database
        // const savedBill = await newBill.save();


        const pdfData: any = {
            ...newBill.toObject(),
            companyLogo: COMPANY_LOGO,
            companyName: 'Vertical Living'
        };

        const pdfBytes = await generateBillAccBillPdf(pdfData);

        const fileName = `bill-${newBill.billNumber}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update bill with PDF data
        newBill.pdfData = {
            type: "pdf",
            url: uploadResult.Location,
            originalName: fileName,
            uploadedAt: new Date(),
        };

        await newBill.save();



        // We use the utility here because it handles Generating the Unique Record ID
        await syncAccountingRecord({
            organizationId: newBill.organizationId,
            projectId: newBill?.projectId || null,

            // Reference Links
            referenceId: newBill._id,
            referenceModel: "BillAccountModel", // Must match Schema

            // Categorization
            deptRecordFrom: "Bill",

            // Person Details
            assoicatedPersonName: newBill.vendorName,
            assoicatedPersonId: newBill?.vendorId || null,
            assoicatedPersonModel: "VendorAccountModel", // Assuming this is your Vendor Model

            // Financials
            amount: newBill?.grandTotal || 0, // Utility takes care of grandTotal logic if passed
            notes: newBill?.notes || "",

            // Defaults for Creation
            status: "pending",
            paymentId: null
        });

        // Invalidate related caches
        await invalidateBillCache(organizationId, vendorId);

        return res.status(201).json({
            ok: true,
            message: "Bill created successfully",
            data: newBill
        });
    } catch (error: any) {
        console.error("Error creating bill:", error);
        return res.status(500).json({
            ok: false,
            message: "Error creating bill",
            error: error.message
        });
    }
};

// GET All bills (with optional filters)
export const getBills = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, vendorId, page = 1, limit = 10, date, search, sortBy = 'createdAt',
            sortOrder = 'desc', billFromDate, billToDate, createdFromDate, createdToDate } = req.query;


        // Build cache key based on query parameters
        const cacheKey = `billaccount:org:${organizationId || 'all'}:vendor:${vendorId || 'all'}:page:${page}:limit:${limit}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:billFromDate:${billFromDate || "all"}:billToDate:${billToDate || "all"}:search${search || "all"}:sort:${sortBy || "all"}:${sortOrder || "desc"}`;

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



        if (billFromDate || billToDate) {
            const filterRange: any = {};

            if (billFromDate) {
                const from = new Date(billFromDate as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid billFromDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (billToDate) {
                const to = new Date(billToDate as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid billToDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            filter.billDate = filterRange;
        }




        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { billNumber: { $regex: search, $options: 'i' } },
            ];
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;


        // Calculate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Get bills with pagination
        const [bill, totalCount] = await Promise.all([
            BillAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            BillAccountModel.countDocuments(filter)
        ])


        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;


        const response = {
            ok: true,
            message: "Bill retrieved successfully",
            data: bill,
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
        console.error("Error getting bill:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving bill",
            error: error.message
        });
    }
};

// GET Single bill by ID
export const getBillById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid bill ID format"
            });
            return;
        }

        // Build cache key
        const cacheKey = `billaccount:${id}`;

        // Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const bill = await BillAccountModel.findById(id)
        // .populate('vendorId', 'name email phone')
        // .populate('organizationId', 'name');

        if (!bill) {
            res.status(404).json({
                ok: false,
                message: "bill not found"
            });
            return;
        }

        const response = {
            ok: true,
            message: "bill retrieved successfully",
            data: bill
        };

        // Cache the response for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 });

        return res.status(200).json(response);

    } catch (error: any) {
        console.error("Error getting bill:", error);
        res.status(500).json({
            ok: false,
            message: "Error retrieving bill",
            error: error.message
        });
    }
};

// UPDATE bill
export const updatebill = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        //   let updateData = parseBodyData(req.body);
        const updateData = req.body;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                ok: false,
                message: "Invalid bill ID format"
            });
            return;
        }

        // wipe the existing array in the database.
        if (updateData.images) {
            delete updateData.images;
        }


        // Check if bill exists
        const existingbill = await BillAccountModel.findById(id);
        if (!existingbill) {
            return res.status(404).json({
                ok: false,
                message: "bill not found"
            });

        }

        // Validate update data
        const validation = validateBillData({
            ...existingbill.toObject(),
            ...updateData
        });

        if (!validation.isValid) {
            return res.status(400).json({
                ok: false,
                message: "Validation failed",
                errors: validation.errors
            });

        }



        // ✅ Directly accept frontend-calculated totals
        updateData.totalAmount = updateData.totalAmount ?? existingbill.totalAmount;
        updateData.discountAmount = updateData.discountAmount ?? existingbill.discountAmount;
        updateData.taxAmount = updateData.taxAmount ?? existingbill.taxAmount;
        updateData.grandTotal = updateData.grandTotal ?? existingbill.grandTotal;


        // If items are being updated, recalculate totals
        if (updateData.items) {
            const processedItems = updateData.items.map((item: any) => ({
                ...item,
                totalCost: (item.quantity || 0) * (item.rate || 0)
            }));

            // const totals = calculateBillTotals(
            //     processedItems,
            //     updateData.discountPercentage ?? existingbill.discountPercentage ?? 0,
            //     updateData.taxPercentage ?? existingbill.taxPercentage ?? 0,
            //     updateData.advancedAmount || existingbill.advancedAmount || 0,
            //     updateData.paymentType || existingbill.paymentType || ""

            // );

            updateData.items = processedItems;
            // updateData.totalAmount = totals.totalAmount;
            // updateData.discountAmount = totals.discountAmount;
            // updateData.taxAmount = totals.taxAmount;
            // updateData.grandTotal = totals.grandTotal;
            updateData.isSyncedWithAccounting = false;

        } else if (updateData.discountPercentage !== undefined || updateData.taxPercentage !== undefined) {
            // Recalculate if discount or tax percentage changed
            // const totals = calculateBillTotals(
            //     existingbill.items,
            //     updateData.discountPercentage ?? existingbill.discountPercentage ?? 0,
            //     updateData.taxPercentage ?? existingbill.taxPercentage ?? 0
            // );

            // updateData.totalAmount = totals.totalAmount;
            // updateData.discountAmount = totals.discountAmount;
            // updateData.taxAmount = totals.taxAmount;
            // updateData.grandTotal = totals.grandTotal;
            // IMPORTANT: Financial data changed, so we must re-sync
            updateData.isSyncedWithAccounting = false;

        }
        else if (updateData.paymentType !== undefined) {

            // const processedItems = updateData.items.map((item: any) => ({
            //     ...item,
            //     totalCost: (item.quantity || 0) * (item.rate || 0)
            // }));

            // const totals = calculateBillTotals(
            //     processedItems,
            //     updateData.discountPercentage ?? existingbill.discountPercentage ?? 0,
            //     updateData.taxPercentage ?? existingbill.taxPercentage ?? 0,
            //     updateData.advancedAmount || existingbill.advancedAmount || 0,
            //     updateData.paymentType || existingbill.paymentType || ""
            // );
        }

        // Update bill
        const updatedbill = await BillAccountModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )

        if (!updatedbill) {
            return res.status(404).json({ message: "bill not found", ok: false })
        }

        const pdfData: any = {
            ...updatedbill.toObject(),
            companyLogo: COMPANY_LOGO,
            companyName: 'Vertical Living'
        };

        const pdfBytes = await generateBillAccBillPdf(pdfData);

        const fileName = `bill-${updatedbill.billNumber}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update bill with PDF data
        updatedbill.pdfData = {
            type: "pdf",
            url: uploadResult.Location,
            originalName: fileName,
            uploadedAt: new Date(),
        };

        await updatedbill.save();


        // 2. UPDATE ACCOUNTS (Direct Update)
        // We strictly avoid touching 'paymentId' or 'status' here
        const isExiting = await AccountingModel.findOneAndUpdate(
            {
                referenceId: updatedbill._id,
                referenceModel: "BillAccountModel"
            },
            {
                $set: {
                    // Update fields that might have changed in the bill
                    amount: updatedbill.grandTotal,
                    notes: updatedbill.notes,
                    projectId: updatedbill?.projectId || null,
                    assoicatedPersonName: updatedbill.vendorName,

                    // Optional: Update person ID if vendor changed
                    assoicatedPersonId: updatedbill?.vendorId || null,

                    // IMPORTANT: We DO NOT include 'status' or 'paymentId' here.
                    // Those are controlled by the Payment Controller.
                }
            },
            { new: true }
        );



        // Invalidate related caches
        await invalidateBillCache((updatedbill as any).organizationId, (updatedbill as any).vendorId, id);


        res.status(200).json({
            ok: true,
            message: "bill updated successfully",
            data: updatedbill
        });
    } catch (error: any) {
        console.error("Error updating bill:", error);
        res.status(500).json({
            ok: false,
            message: "Error updating bill",
            error: error.message
        });
    }
};




// --- SEPARATE UPLOAD ONLY ENDPOINT ---
export const uploadBillImagesOnly = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const files = req.files as (Express.Multer.File & { location: string })[];
        if (!files || files.length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const mappedFiles = files.map(file => ({
            _id: new mongoose.Types.ObjectId(),
            type: file.mimetype.startsWith("image") ? "image" : "pdf",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date()
        }));

        const updatedBill = await BillAccountModel.findByIdAndUpdate(
            id,
            { $push: { images: { $each: mappedFiles } } }, // $push appends specifically
            { new: true }
        );

        if (!updatedBill) {
            return res.status(404).json({ message: "bill not found", ok: false })
        }


        const pdfData: any = {
            ...updatedBill.toObject(),
            companyLogo: COMPANY_LOGO,
            companyName: 'Vertical Living'
        };

        const pdfBytes = await generateBillAccBillPdf(pdfData);

        const fileName = `bill-${updatedBill.billNumber}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update bill with PDF data
        updatedBill.pdfData = {
            type: "pdf",
            url: uploadResult.Location,
            originalName: fileName,
            uploadedAt: new Date(),
        };

        await updatedBill.save();

        await invalidateBillCache((updatedBill as any).organizationId, (updatedBill as any).vendorId, id);


        res.status(200).json({ ok: true, message: "Images added successfully", data: updatedBill });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};






// DELETE bill

export const deleteBill = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid bill ID format"
            });
        }

        const deletedbill = await BillAccountModel.findByIdAndDelete(id);

        if (!deletedbill) {
            return res.status(404).json({
                ok: false,
                message: "bill not found"
            });

        }


        // Invalidate related caches
        await invalidateBillCache(
            deletedbill.organizationId?.toString(),
            deletedbill.vendorId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "bill deleted successfully",
            data: deletedbill
        });
    } catch (error: any) {
        console.error("Error deleting bill:", error);
        res.status(500).json({
            ok: false,
            message: "Error deleting bill",
            error: error.message
        });
    }
};




export const deleteBillImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id, imageId } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid bill ID format"
            });
        }

        const bill = await BillAccountModel.findById(id);

        if (!bill) {
            return res.status(404).json({
                ok: false,
                message: "bill not found"
            });

        }
        bill.images = bill.images.filter(
            (image: any) => image._id.toString() !== imageId
        );

        await bill.save();


        // Invalidate related caches
        await invalidateBillCache(
            bill.organizationId?.toString(),
            bill.vendorId?.toString(),
            id
        );

        return res.status(200).json({
            ok: true,
            message: "bill image deleted successfully",
            data: bill
        });
    } catch (error: any) {
        console.error("Error deleting bill:", error);
        res.status(500).json({
            ok: false,
            message: "Error deleting bill",
            error: error.message
        });
    }
};










//  SYNC TO ACCOUNTS 



// export const sendBillToAccounting = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { billId } = req.params; // We expect the Bill ID to be sent

//         // 1. Validate Bill ID
//         if (!mongoose.Types.ObjectId.isValid(billId)) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "Invalid Bill ID format"
//             });
//         }

//         // 2. Fetch the Bill
//         const bill = await BillAccountModel.findById(billId);
//         if (!bill) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "Bill not found"
//             });
//         }


//         // 3. Prepare the Accounting Items (Mapped from Bill)
//         const accountItems = bill.items.map((item: any) => ({
//             itemName: item.itemName,
//             quantity: item.quantity,
//             rate: item.rate,
//             unit: item.unit || "",
//             totalCost: item.totalCost,
//             dueDate: bill.dueDate,
//             status: "pending",
//             orderId: "",
//             paymentId: "",
//             transactionId: "",
//             paidAt: null,
//             failureReason: "",
//             fees: null,
//             tax: null
//         }));



//         // --- CASE B: CREATE NEW ---

//         const recordNumber = await generateTransactionNumber(bill.organizationId);

//         const newAccountingEntry = new AccountingModel({
//             recordNumber: recordNumber,
//             organizationId: bill.organizationId,
//             transactionType: 'expense',
//             fromDept: req.body.fromDept || 'procurement',
//             items: accountItems,
//             totalAmount: {
//                 amount: bill.grandTotal || 0,
//                 taxAmount: bill.taxAmount || 0
//             },
//             status: 'pending',
//             dueDate: bill.dueDate || null,
//             notes: `Generated from Vendor Bill #${bill.billNumber}. ${bill.notes ? `Ref: ${bill.notes}` : ''}`,
//             paidAt: null,
//             installMents: []
//         });

//         const savedEntry = await newAccountingEntry.save();

//         // --- CRITICAL: LINK BACK TO BILL ---
//         bill.accountingRef = savedEntry._id as any;
//         bill.isSyncedWithAccounting = true;
//         await bill.save();

//         await invalidateBillCache((bill as any).organizationId, (bill as any).vendorId, bill._id as string);


//         return res.status(201).json({
//             ok: true,
//             message: "Sent to Accounting Department successfully",
//             data: savedEntry
//         });

//     } catch (error: any) {
//         console.error("Error sending bill to accounting:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Error processing request",
//             error: error.message
//         });
//     }
// }



//  SYNC TO PAYMENT MAIN

export const sendBillToPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { billId } = req.params; // We expect the Bill ID to be sent

        // 1. Validate Bill ID
        if (!mongoose.Types.ObjectId.isValid(billId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Bill ID format"
            });
        }

        // 2. Fetch the Bill
        const bill = await BillAccountModel.findById(billId);
        if (!bill) {
            return res.status(404).json({
                ok: false,
                message: "Bill not found"
            });
        }


        if (bill?.isSyncWithPaymentsSection) {
            return res.status(400).json({ message: "Bill Already sent to the payment section", ok: false })
        }


        // 3. Prepare the Accounting Items (Mapped from Bill)
        const paymentItems = bill.items.map((item: any) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            unit: item.unit || "",
            totalCost: item.totalCost,
            dueDate: bill.dueDate,
            status: "pending",
            orderId: "",
            paymentId: "",
            transactionId: "",
            paidAt: null,
            failureReason: "",
            fees: null,
            tax: null
        }));


        const newPayemnt = await createPaymentMainAccUtil({
            paymentPersonId: bill.vendorId || null,
            paymentPersonModel: bill?.vendorId ? "VendorAccountModel" : null,
            paymentPersonName: bill?.vendorName || "",
            organizationId: bill.organizationId,
            accountingRef: null,
            projectId: bill?.projectId || null,
            fromSectionModel: "BillAccountModel",
            fromSectionId: bill._id as Types.ObjectId,
            fromSection: "bill",
            paymentDate: null,
            dueDate: bill.dueDate,
            subject: bill.subject,
            items: paymentItems,
            totalAmount: bill.totalAmount || 0,
            discountPercentage: bill.discountPercentage || 0,
            discountAmount: bill.discountAmount || 0,
            taxPercentage: bill.taxPercentage || 0,
            taxAmount: bill.taxAmount || 0,
            grandTotal: bill.grandTotal || 0,
            notes: bill.notes || null,
            isSyncedWithAccounting: false,
            generalStatus: "pending"
        })

        bill.isSyncWithPaymentsSection = true;
        await bill.save()




        await invalidateBillCache((bill as any).organizationId, (bill as any).vendorId, bill._id as string);


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
