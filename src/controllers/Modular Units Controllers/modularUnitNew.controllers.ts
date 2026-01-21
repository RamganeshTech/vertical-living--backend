import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { IModularUnitUpload, ModularUnitModelNew } from "../../models/Modular Units Models/Modular Unit New/modularUnitNew.model";
import redisClient from "../../config/redisClient";
import { json } from "stream/consumers";


// helper futninos

// Helper function to generate unique invoice number
const generateSerialNumber = async (organizationId: string): Promise<string> => {
    try {
        const orgId = organizationId.toString();

        // Get all invoices for this organization
        const units = await ModularUnitModelNew.find(
            { organizationId: new mongoose.Types.ObjectId(orgId) },
            { serialNo: 1 }
        ).lean();
        // console.log("invoices", invoices)
        if (units.length === 0) {
            return `MDU-${orgId.slice(0, 5)}-1`;
        }

        // Extract the unique numbers from all invoice numbers
        const numbers = units
            .map(unit => {
                if (!unit.serialNo) return 0;
                const parts = unit.serialNo.split('-');
                const lastPart = parts[parts.length - 1];
                return parseInt(lastPart) || 0;
            })
            .filter(num => num > 0);

        // Find the maximum number
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

        // Return new invoice number with incremented value
        return `MDU-${orgId.slice(0, 5)}-${maxNumber + 1}`;
    } catch (error) {
        throw new Error("Error generating serial number");
    }
};


// ==================== CREATE ====================
export const createModularUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        // Validate organizationId
        if (!Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ ok: false, message: "Invalid organization ID" });
        }

        // Process uploaded images from different fields
        let productImages: IModularUnitUpload[] = [];
        let images2d: IModularUnitUpload[] = [];
        let images3d: IModularUnitUpload[] = [];
        let cutlistDoc: IModularUnitUpload[] = [];

        if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
            // Handle multiple file fields
            const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Process product images
            if (filesObj['productImages']) {
                productImages = filesObj['productImages'].map((file: any) => ({
                    type: "image",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }

            // Process 2D images
            if (filesObj['2dImages']) {
                images2d = filesObj['2dImages'].map((file: any) => ({
                    type: "image",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }

            // Process 3D images
            if (filesObj['3dImages']) {
                images3d = filesObj['3dImages'].map((file: any) => ({
                    type: "image",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }

            if (filesObj['cutlistDoc']) {
                cutlistDoc = filesObj['cutlistDoc'].map((file: any) => ({
                    type: "pdf",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }
        }


        // --- 1. Handle Parts Parsing ---
        let parts = [];
        if (req.body.parts) {
            try {
                parts = typeof req.body.parts === 'string' ? JSON.parse(req.body.parts) : req.body.parts;
            } catch (e) {
                return res.status(400).json({ ok: false, message: "Invalid format for parts array" });
            }
        }

        const serialNo = await generateSerialNumber(organizationId)

        // Create new modular unit
        const newUnit = new ModularUnitModelNew({
            organizationId: new Types.ObjectId(organizationId),
            productName: req.body.productName,
            attributes: req.body.attributes ? JSON.parse(req.body.attributes) : [],
            serialNo: serialNo || null,
            dimention: {
                height: req.body.dimention.height || null,
                width: req.body.dimention.width || null,
                // depth: req.body.dimention.depth || null,
            },
            parts,
            description: req.body.description,
            totalAreaSqFt: req.body.totalAreaSqFt,
            materialsNeeded: req.body.materialsNeeded,
            fabricationCost: req.body.fabricationCost,
            timeRequired: req.body.timeRequired,
            price: req.body.price,
            productImages,
            "2dImages": images2d,
            "3dImages": images3d,
            "cutlistDoc": cutlistDoc,
            category: req.body.category,
        });

        await newUnit.save();

        // Invalidate cache for this organization's units
        const cacheKey = `modular_units:org:${organizationId}:*`;
        const keys = await redisClient.keys(cacheKey);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(201).json({
            ok: true,
            message: "Modular unit created successfully",
            data: newUnit,
        });
    } catch (error: any) {
        console.error("Error creating modular unit:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to create modular unit",
            error: error.message,
        });
    }
};

// ==================== GET ALL (with filters & pagination) ====================
export const getAllModularUnitsNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const {
            page = 1,
            limit = 10,
            category,
            minPrice,
            maxPrice,
            // New Dimension Filters
            minHeight, maxHeight,
            minWidth, maxWidth,
            // minDepth, maxDepth,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Validate organizationId
        if (!Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ ok: false, message: "Invalid organization ID" });
        }

        // Build Redis cache key based on query params
        const cacheKey = `modular_units:org:${organizationId}:page:${page}:limit:${limit}:cat:${category || 'all'}:search:${search || 'none'}
        :sort:${sortBy}:${sortOrder}:fabricationCost:${minPrice || 0}-${maxPrice || 'max'}
        :h:${minHeight || 0}-${maxHeight || 'max'}:w:${minWidth || 0}-${maxWidth || 'max'}
        `;

        // Check Redis cache
        //  await redisClient.del(cacheKey);
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: "Modular units fetched from cache",
                data: JSON.parse(cachedData),
            });
        }

        // Build filter query
        const filter: any = { organizationId: new Types.ObjectId(organizationId) };

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.fabricationCost = {};
            if (minPrice) filter.fabricationCost.$gte = Number(minPrice);
            if (maxPrice) filter.fabricationCost.$lte = Number(maxPrice);
        }


        // Height Filter
        if (minHeight || maxHeight) {
            filter["dimention.height"] = {};
            if (minHeight) filter["dimention.height"].$gte = Number(minHeight);
            if (maxHeight) filter["dimention.height"].$lte = Number(maxHeight);
        }

        // Width Filter
        if (minWidth || maxWidth) {
            filter["dimention.width"] = {};
            if (minWidth) filter["dimention.width"].$gte = Number(minWidth);
            if (maxWidth) filter["dimention.width"].$lte = Number(maxWidth);
        }

        // Depth (Breadth) Filter
        // if (minDepth || maxDepth) {
        //     filter["dimention.depth"] = {};
        //     if (minDepth) filter["dimention.depth"].$gte = Number(minDepth);
        //     if (maxDepth) filter["dimention.depth"].$lte = Number(maxDepth);
        // }

        if (search) {
            filter.$or = [
                { productName: { $regex: search, $options: "i" } },
                { serialNo: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                // { attributes: { $in: search, $options: "i" } },
                {
                    attributes: {
                        $elemMatch: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                }
            ];
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        // const sort: any = {};
        // sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Fetch data
        const [units, total] = await Promise.all([
            ModularUnitModelNew.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ModularUnitModelNew.countDocuments(filter),
        ]);

        const result = {
            units,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
            },
        };

        // Cache the result for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 60 * 10 });

        return res.status(200).json({
            ok: true,
            message: "Modular units fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("Error fetching modular units:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch modular units",
            error: error.message,
        });
    }
};

// ==================== GET ONE (detailed view) ====================
export const getModularUnitByIdNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { unitId } = req.params;

        // Validate unitId
        if (!Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({ ok: false, message: "Invalid unit ID" });
        }

        // Build Redis cache key
        const cacheKey = `modular_unit:${unitId}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: "Modular unit fetched from cache",
                data: JSON.parse(cachedData),
            });
        }

        // Fetch from database
        const unit = await ModularUnitModelNew.findById(unitId).lean();

        if (!unit) {
            return res.status(404).json({
                ok: false,
                message: "Modular unit not found",
            });
        }

        // Cache the result for 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(unit), { EX: 60 * 10 });

        return res.status(200).json({
            ok: true,
            message: "Modular unit fetched successfully",
            data: unit,
        });
    } catch (error: any) {
        console.error("Error fetching modular unit:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch modular unit",
            error: error.message,
        });
    }
};

// ==================== UPDATE ====================
export const updateModularUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { unitId } = req.params;

        // Validate unitId
        if (!Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({ ok: false, message: "Invalid unit ID" });
        }

        // Find existing unit
        const existingUnit = await ModularUnitModelNew.findById(unitId);
        if (!existingUnit) {
            return res.status(404).json({
                ok: false,
                message: "Modular unit not found",
            });
        }


        // console.log("Request Body:", req.body);
        // Process uploaded images from different fields
        let productImages: IModularUnitUpload[] = [...existingUnit.productImages];
        let images2d: IModularUnitUpload[] = [...existingUnit["2dImages"]];
        let images3d: IModularUnitUpload[] = [...existingUnit["3dImages"]];
        let cutlistDoc: IModularUnitUpload[] = [...existingUnit["cutlistDoc"]];

        if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
            const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Process product images
            if (filesObj['productImages']) {
                const newProductImages = filesObj['productImages'].map((file: any) => ({
                    type: "image" as const,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
                productImages = req.body.replaceProductImages === 'true'
                    ? newProductImages
                    : [...productImages, ...newProductImages];
            }

            // Process 2D images
            if (filesObj['2dImages']) {
                const new2dImages = filesObj['2dImages'].map((file: any) => ({
                    type: "image" as const,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
                images2d = req.body.replace2dImages === 'true'
                    ? new2dImages
                    : [...images2d, ...new2dImages];
            }

            // Process 3D images
            if (filesObj['3dImages']) {
                const new3dImages = filesObj['3dImages'].map((file: any) => ({
                    type: "image" as const,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
                images3d = req.body.replace3dImages === 'true'
                    ? new3dImages
                    : [...images3d, ...new3dImages];
            }

            if (filesObj['cutlistDoc']) {
                const newCutlistDoc = filesObj['cutlistDoc'].map((file: any) => ({
                    type: "pdf" as const,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date(),
                }));
                cutlistDoc = req.body.replaceCutlistDoc === 'true'
                    ? newCutlistDoc
                    : [...cutlistDoc, ...newCutlistDoc];
            }



        }



        // Build update object
        const updateData: any = {
            productImages,
            "2dImages": images2d,
            "3dImages": images3d,
            "cutlistDoc": cutlistDoc,
        };

        // --- Handle Parts Update ---
        if (req.body.parts) {
            try {
                updateData.parts = typeof req.body.parts === 'string' ? JSON.parse(req.body.parts) : req.body.parts;
            } catch (e) {
                return res.status(400).json({ ok: false, message: "Invalid parts data" });
            }
        }

        // Update other fields if provided
        if (req.body.productName) updateData.productName = req.body.productName;
        // if (req.body.attributes) updateData.attributes = JSON.parse(req.body.attributes);
        if (req.body.attributes) {
            try {
                updateData.attributes = JSON.parse(req.body.attributes);
            } catch {
                updateData.attributes = req.body.attributes;
            }
        }
        if (req.body.serialNo) updateData.serialNo = req.body.serialNo;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.totalAreaSqFt) updateData.totalAreaSqFt = req.body.totalAreaSqFt;
        if (req.body.materialsNeeded) updateData.materialsNeeded = req.body.materialsNeeded;
        if (req.body.fabricationCost) updateData.fabricationCost = req.body.fabricationCost;
        if (req.body.timeRequired) updateData.timeRequired = req.body.timeRequired;
        // if (req.body.price) updateData.price = req.body.price;
        if (req.body.category) updateData.category = req.body.category;

        // Update dimensions if provided
        let dimentionData: any = null;

        if (req.body.dimention) {
            try {
                // If dimention is sent as JSON string
                dimentionData = typeof req.body.dimention === 'string'
                    ? JSON.parse(req.body.dimention)
                    : req.body.dimention;
            } catch (error) {
                console.error("Error parsing dimention:", error);
            }
        }

        // ✅ FIX: Also check for individual dimension fields (alternative approach)
        const height = req.body['dimention.height'] || req.body.height || dimentionData?.height;
        const width = req.body['dimention.width'] || req.body.width || dimentionData?.width;
        // const depth = req.body['dimention.depth'] || req.body.depth || dimentionData?.depth;

        // Update dimensions if any dimension field is provided
        if (height !== undefined || width !== undefined ) {
            updateData.dimention = {
                height: height ? Number(height) : existingUnit.dimention.height,
                width: width ? Number(width) : existingUnit.dimention.width,
                // depth: depth ? Number(depth) : existingUnit.dimention.depth,
            };
        }

        // console.log("Update Data:", updateData);


        // Update in database
        const updatedUnit = await ModularUnitModelNew.findByIdAndUpdate(
            unitId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // Invalidate cache
        await redisClient.del(`modular_unit:${unitId}`);
        const orgCacheKeys = await redisClient.keys(`modular_units:org:${existingUnit.organizationId}:*`);
        if (orgCacheKeys.length > 0) {
            await redisClient.del(orgCacheKeys);
        }

        return res.status(200).json({
            ok: true,
            message: "Modular unit updated successfully",
            data: updatedUnit,
        });
    } catch (error: any) {
        console.error("Error updating modular unit:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to update modular unit",
            error: error.message,
        });
    }
};

// ==================== DELETE ====================
export const deleteModularUnitNew = async (req: Request, res: Response): Promise<any> => {
    try {
        const { unitId } = req.params;

        // Validate unitId
        if (!Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({ ok: false, message: "Invalid unit ID" });
        }

        // Find and delete
        const deletedUnit = await ModularUnitModelNew.findByIdAndDelete(unitId);

        if (!deletedUnit) {
            return res.status(404).json({
                ok: false,
                message: "Modular unit not found",
            });
        }

        // Invalidate cache
        await redisClient.del(`modular_unit:${unitId}`);
        const orgCacheKeys = await redisClient.keys(`modular_units:org:${deletedUnit.organizationId}:*`);
        if (orgCacheKeys.length > 0) {
            await redisClient.del(orgCacheKeys);
        }

        return res.status(200).json({
            ok: true,
            message: "Modular unit deleted successfully",
            data: deletedUnit,
        });
    } catch (error: any) {
        console.error("Error deleting modular unit:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to delete modular unit",
            error: error.message,
        });
    }
};





