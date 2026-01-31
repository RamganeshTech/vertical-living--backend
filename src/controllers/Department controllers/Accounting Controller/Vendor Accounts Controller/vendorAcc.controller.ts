// src/controllers/customerController.ts

import { Request, Response } from 'express';

import redisClient from '../../../../config/redisClient';
import { RoleBasedRequest } from '../../../../types/types';
import { validateCreateVendor, validateUpdateVendor } from './vendorAccountsValidation';
import VendorAccountModel from '../../../../models/Department Models/Accounting Model/vendor.model';
import { validateMongoId } from '../Customer Accounts Controllers/customerAccoutsValidation';
import { getCoordinatesFromGoogleMapUrl } from '../../../../utils/common features/utils';

export const createVendor = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        if (req.body.phone && typeof req.body.phone === 'string') {
            req.body.phone = JSON.parse(req.body.phone);
        }

        if (req.body.location && typeof req.body.location === 'string') {
            req.body.location = JSON.parse(req.body.location);
        }

        // Convert string numbers to actual numbers
        if (req.body.openingBalance && typeof req.body.openingBalance === 'string') {
            req.body.openingBalance = parseFloat(req.body.openingBalance);
        }


        if (req.body.priority && typeof req.body.priority === 'string') {
            req.body.priority = parseFloat(req.body.priority);

        }

        // // Convert string boolean to actual boolean
        // if (req.body.enablePortal !== undefined && typeof req.body.enablePortal === 'string') {
        //     req.body.enablePortal = req.body.enablePortal === 'true';
        // }

        // Validate request body
        const validationResult = validateCreateVendor(req.body);

        if (!validationResult.isValid) {
            return res.status(400).json({
                ok: false,
                message: 'Validation failed',
                errors: validationResult.errors
            });
        }

        // Check if customer with same email already exists for this project
        if (req.body.email) {
            const existingCustomer = await VendorAccountModel.findOne({
                email: req.body.email,
                // projectId: req.body.projectId
            });

            if (existingCustomer) {
                return res.status(409).json({
                    ok: false,
                    message: 'Vendor with this email already exists in this project'
                });
            }
        }

        const uploadedFiles = req.files as { [fieldname: string]: (Express.Multer.File & { location: string })[] };

        // Handle uploaded files (if any)
        const documents: any[] = [];
        const shopImages: any[] = [];
        // let mainImage: any | null = null;



        // if (uploadedFiles && uploadedFiles['mainImage'] && uploadedFiles['mainImage'][0]) {
        //     const file = uploadedFiles['mainImage'][0];

        //     // YOU MUST SAVE THIS AS AN OBJECT, NOT A STRING
        //     mainImage = {
        //         type: "image",
        //         url: file.location, // This is the S3 URL
        //         originalName: file.originalname,
        //         uploadedAt: new Date()
        //     };
        // }

        if (uploadedFiles && uploadedFiles['files'] && uploadedFiles['files'].length > 0) {
            uploadedFiles['files'].forEach((file) => {
                const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
                documents.push({
                    type: type,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                });
            });
        }

        if (uploadedFiles && uploadedFiles['shopImages'] && uploadedFiles['shopImages'].length > 0) {
            uploadedFiles['shopImages'].forEach((file) => {
                const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
                shopImages.push({
                    type: type,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                });
            });
        }

        // if (req.body.location && req.body.location.mapUrl) {
        //     const { lat, lng } = await getCoordinatesFromGoogleMapUrl(req.body.location.mapUrl);

        //     // Save the extracted coords
        //     req.body.location.latitude = lat;
        //     req.body.location.longitude = lng;
        // }

        // 5. Handle Location / Map URL logic
        // Even though mapUrl is not in schema, we use it to calculate lat/lng
        const mapUrlToProcess = req.body?.mapUrl ? req.body.mapUrl : null;

        if (mapUrlToProcess) {
            // Extract coordinates
            const { lat, lng } = await getCoordinatesFromGoogleMapUrl(mapUrlToProcess);

            // Ensure location object exists
            if (!req.body.location) {
                req.body.location = {};
            }

            // Assign values to match the Schema
            req.body.location.latitude = lat;
            req.body.location.longitude = lng;
            req.body.mapUrl = mapUrlToProcess; // <--- Now we SAVE this

            // Clean up root level mapUrl if it existed (to keep req.body clean)
            // if (req.body.mapUrl) delete req.body.mapUrl; 
        }

        // Create customer
        const vendor = new VendorAccountModel({ ...req.body, documents, shopImages });
        await vendor.save();

        // Invalidate cache for the organiziaotns's customer list
        // const cachePattern = `customers:organizationId:${req.body.organizationId}:*`;
        const cachePattern = `vendors:organizationId:${req.body.organizationId}*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(201).json({
            ok: true,
            message: 'vendor created okfully',
            data: vendor
        });

    } catch (error: any) {
        console.error('Error creating vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const updateVendor = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid vendor ID format'
            });
        }


        if (req.body?.documents) {
            return res.status(400).json({
                ok: false,
                message: 'Document field is not allowed'
            });
        }

        if (req.body?.shopImages) {
            return res.status(400).json({
                ok: false,
                message: 'ShopImages is not allowed'
            });
        }

        // Validate request body
        const validationResult = validateUpdateVendor(req.body);

        if (!validationResult.isValid) {
            return res.status(400).json({
                ok: false,
                message: 'Validation failed',
                errors: validationResult.errors
            });
        }

        // Check if customer exists
        const existingVendor = await VendorAccountModel.findById(id);
        if (!existingVendor) {
            return res.status(404).json({
                ok: false,
                message: 'Vendor not found'
            });
        }

        // Check if email is being updated and if it's unique
        if (req.body.email && req.body.email !== existingVendor.email) {
            const duplicateEmail = await VendorAccountModel.findOne({
                email: req.body.email,
                // projectId: existingVendor.projectId,
                _id: { $ne: id }
            });

            if (duplicateEmail) {
                return res.status(409).json({
                    ok: false,
                    message: 'Vendor with this email already exists in this project'
                });
            }
        }


        // Handle Map URL Update
        if (req.body.mapUrl) {
            const { lat, lng } = await getCoordinatesFromGoogleMapUrl(req.body.mapUrl);

            // Update location with new coords, preserving existing address/fields
            req.body.location = {
                ...(req.body.location || existingVendor.location || {}),
                latitude: lat,
                longitude: lng
            };
            // req.body.mapUrl is already at the root, so it will update automatically via $set
        }


        // Update customer
        const updatedVendor = await VendorAccountModel.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        // Invalidate cache
        const cacheKey = `vendor:${id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `customers:organizationId:${existingVendor.organizationId}:*`;
        const cachePattern = `vendors:organizationId:${req.body.organizationId}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Vendor updated okfully',
            data: updatedVendor
        });

    } catch (error: any) {
        console.error('Error updating vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



export const updateVendorMainImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { vendorId } = req.params;

        // 1. Check if file exists
        // Note: Since we use imageUploadToS3.single('mainImage'), the file is in req.file (not req.files)
        const file = req.file as (Express.Multer.File & { location: string });

        if (!file) {
            return res.status(400).json({
                ok: false,
                message: 'No image file provided'
            });
        }


        const mainImageObject = {
            url: file.location,
            originalName: file.originalname,
            type: "image",
            uploadedAt: new Date()
        };



        // 2. Update Database
        const updatedVendor = await VendorAccountModel.findByIdAndUpdate(
            vendorId,
            { mainImage: mainImageObject },
            { new: true } // Return updated doc
        );

        if (!updatedVendor) {
            return res.status(404).json({
                ok: false,
                message: 'Vendor not found'
            });
        }

        const cacheKey = `vendor:${updatedVendor._id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `customers:organizationId:${existingVendor.organizationId}:*`;
        const cachePattern = `vendors:organizationId:${req.body.organizationId}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Shop image updated successfully',
            data: {
                mainImage: updatedVendor.mainImage
            }
        });

    } catch (error: any) {
        console.error('Error updating shop image:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};




export const updateVendorDoc = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid vendor ID format'
            });
        }


        const documents: any[] = [];

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const files = req.files as (Express.Multer.File & { location: string })[];

            files.forEach((file) => {
                // const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
                // const documentType = fileExtension === 'pdf' ? 'pdf' : 'image';
                const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";

                documents.push({
                    type: type,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                });
            });
        }

        // Update Vendor - push documents to array
        const updatedVendor = await VendorAccountModel.findByIdAndUpdate(
            id,
            { $push: { documents: { $each: documents } } }, // Use $each to push multiple documents
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.status(400).json({
                ok: false,
                message: 'Vendor not found',
            });
        }
        // Invalidate cache
        const cacheKey = `vendor:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `vendors:organizationId:${updatedVendor.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Vendor updated okfully',
            data: updatedVendor
        });
    } catch (error: any) {
        console.error('Error updating Vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}


export const updateVendorShopImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid vendor ID format'
            });
        }


        const shopImages: any[] = [];

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const files = req.files as (Express.Multer.File & { location: string })[];

            files.forEach((file) => {
                // const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
                // const documentType = fileExtension === 'pdf' ? 'pdf' : 'image';
                const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";

                shopImages.push({
                    type: type,
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                });
            });
        }

        // Update Vendor - push documents to array
        const updatedVendor = await VendorAccountModel.findByIdAndUpdate(
            id,
            { $push: { shopImages: { $each: shopImages } } }, // Use $each to push multiple documents
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.status(400).json({
                ok: false,
                message: 'Vendor not found',
            });
        }
        // Invalidate cache
        const cacheKey = `vendor:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `vendors:organizationId:${updatedVendor.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'vendo rshop images updated',
            data: updatedVendor
        });
    } catch (error: any) {
        console.error('Error updating Vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

/**
 * Delete a customer
 * DELETE /api/customers/:id
 */
export const deleteVendor = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate Vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid Vendor ID format'
            });
        }

        // Delete vendor
        const vendor = await VendorAccountModel.findByIdAndDelete(id);
        if (!vendor) {
            return res.status(404).json({
                ok: false,
                message: 'vendor not found'
            });
        }

        // Invalidate cache
        const cacheKey = `vendor:${id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `vendors:organizationId:${vendor.organizationId}:*`;
        const cachePattern = `vendors:organizationId:${vendor?.organizationId?.toString()}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'vendor deleted okfully'
        });

    } catch (error: any) {
        console.error('Error deleting vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
/**
 * Get single vendor with Redis caching
 * GET /api/vendors/:id
 */
export const getvendor = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid vendor ID format'
            });
        }

        // Check cache
        const cacheKey = `vendor:${id}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'vendor fetched okfully (from cache)',
                data: JSON.parse(cachedData),
            });
        }

        // Fetch from database
        const vendor = await VendorAccountModel.findById(id)
        // .populate('projectId', 'name')
        // .populate('clientId', 'name');

        if (!vendor) {
            return res.status(404).json({
                ok: false,
                message: 'vendor not found'
            });
        }

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(vendor), { EX: 60 * 10 }); // cache for 10 min

        return res.status(200).json({
            ok: true,
            message: 'vendor fetched okfully',
            data: vendor,

        });

    } catch (error: any) {
        console.error('Error fetching vendor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all vendors with pagination and filters
 * GET /api/vendors
 * Query params: page, limit, projectId, firstName, lastName, vendorType, search
 */
export const getAllvendors = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            page = '1',
            limit = '10',
            organizationId,
            // projectId,
            // firstName,
            // lastName,
            // vendorType,
            createdFromDate,
            createdToDate,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid page number'
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid limit. Must be between 1 and 100'
            });
        }

        // Validate organizationId if provided
        if (organizationId && !validateMongoId(organizationId as string)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid project ID format'
            });
        }


        // Build filter object
        const filter: any = {};

        if (organizationId) {
            filter.organizationId = organizationId;
        }

        // if (projectId) {
        //     filter.projectId = projectId;
        // }


        // if (firstName) {
        //     filter.firstName = { $regex: firstName, $options: 'i' };
        // }

        // if (lastName) {
        //     filter.lastName = { $regex: lastName, $options: 'i' };
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




        // Search across multiple fields
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'phone.work': { $regex: search, $options: 'i' } },
                { 'phone.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        // Create cache key based on filters
        const cacheKey = `vendors:organizationId:${organizationId || 'all'}:page:${pageNum}:limit:${limitNum}:search:${search || 'none'}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:sort:${sortBy}:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        //  await redisClient.del(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'vendors fetched okfully (from cache)',
                ...JSON.parse(cachedData),

            });
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

        // Calculate skip
        const skip = (pageNum - 1) * limitNum;

        // Fetch vendors with pagination
        const [vendors, totalCount] = await Promise.all([
            VendorAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                // .populate('projectId', 'ProjectNAme')
                // .populate('clientId', 'clientName')
                .lean(),
            VendorAccountModel.countDocuments(filter)
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const response = {
            data: vendors,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                organizationId: organizationId || null,
                // vendorType: vendorType || null,
                // firstName: firstName || null,
                // lastName: lastName || null,
                search: search || null
            }
        };

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 }); // cache for 10 min

        return res.status(200).json({
            ok: true,
            message: 'vendors fetched okfully',
            ...response,

        });

    } catch (error: any) {
        console.error('Error fetching vendors:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};




export const getAllvendorDropDown = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId, priority
        } = req.query;


        // Validate organizationId if provided
        if (organizationId && !validateMongoId(organizationId as string)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid project ID format'
            });
        }




        // Build filter object
        const filter: any = {};

        if (organizationId) {
            filter.organizationId = organizationId;
        }

        // Filter by Priority if provided in query
        // if (priority) {
        //     // This checks if the string priority exists inside the priority array in DB
        //     filter.priority = { $in: [priority] };
        // }

        // To this (Case-insensitive fuzzy match):
        if (priority) {
            filter.priority = {
                $elemMatch: { $regex: new RegExp(`^${priority}$`, 'i') }
            };
        }


        // Create cache key based on filters
        const cacheKey = `vendors:dropdown:organizationId:${organizationId || 'all'}:pri:${priority || 'all'}`;

        // Check cache
        // await redisClient.del(cacheKey);
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'vendors fetched okfully (from cache)',
                data: JSON.parse(cachedData),
            });
        }


        // Fetch vendors with pagination
        const vendors = await VendorAccountModel.find(filter).select('_id firstName lastName email shopDisplayName shopFullAddress phone priority') // Only select needed fields
            .lean();

        let modifiedvendor = vendors.map(vendor => {
            return {
                _id: vendor._id,
                vendorName: `${vendor.firstName}`,
                email: vendor.email || "",
                shopName: vendor.shopDisplayName || "",
                address: vendor.shopFullAddress || "",
                phoneNo: vendor.phone?.work || vendor.phone?.mobile || "",
                priority: vendor?.priority || []
            }
        })


        // Cache the result
        await redisClient.set(cacheKey, JSON.stringify(modifiedvendor), { EX: 60 * 10 }); // 10 min


        return res.status(200).json({
            ok: true,
            message: 'vendors fetched okfully',
            data: modifiedvendor
        });

    } catch (error: any) {
        console.error('Error fetching vendors:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}