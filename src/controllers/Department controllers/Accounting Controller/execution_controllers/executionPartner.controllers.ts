// src/controllers/customerController.ts

import { Request, Response } from 'express';

import redisClient from '../../../../config/redisClient';
import { RoleBasedRequest } from '../../../../types/types';
import { validateEmail, validateMongoId, validatePhone } from '../Customer Accounts Controllers/customerAccoutsValidation';
import { getCoordinatesFromGoogleMapUrl } from '../../../../utils/common features/utils';
import ExecutionPartnerModel from '../../../../models/Department Models/Accounting Model/executionPartner.model';

export const createExecutionPartner = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {




        // organizationId validation
        if (!req.body.organizationId || !validateMongoId(req.body.organizationId)) {
            res.status(400).json({ ok: false, message: 'Invalid organization Id format' });
        }

        // Email validation (if provided)
        if (req.body.email && req.body.email.trim() !== '' && req.body.email !== null) {
            if (!validateEmail(req.body.email)) {
                res.status(400).json({ ok: false, message: 'Invalid email format' });
            }
        }


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


        // Phone validation (if provided)
        if (req.body.phone) {
            // if (data.phone.work && data.phone.work.trim() !== '' && data.phone.work !== null) {
            //     if (!validatePhone(data.phone.work)) {
            //         errors.push({ field: 'phone.work', message: 'Invalid work phone format' });
            //     }
            // }
            if (req.body.phone.mobile && req.body.phone.mobile.trim() !== '' && req.body.phone.mobile !== null) {
                if (!validatePhone(req.body.phone.mobile)) {
                    res.status(400).json({ ok: false, message: 'Invalid mobile phone format' });
                }
            }
        }



        // // Convert string boolean to actual boolean
        // if (req.body.enablePortal !== undefined && typeof req.body.enablePortal === 'string') {
        //     req.body.enablePortal = req.body.enablePortal === 'true';
        // }

        // Validate request body
        // const validationResult = validateCreateVendor(req.body);

        // if (!validationResult.isValid) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: 'Validation failed',
        //         errors: validationResult.errors
        //     });
        // }

        // Check if customer with same email already exists for this project
        if (req.body.email) {
            const existingCustomer = await ExecutionPartnerModel.findOne({
                email: req.body.email,
                // projectId: req.body.projectId
            });

            if (existingCustomer) {
                return res.status(409).json({
                    ok: false,
                    message: 'Partner with this email already exists in this project'
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
        const vendor = new ExecutionPartnerModel({ ...req.body, documents, shopImages });
        await vendor.save();

        // Invalidate cache for the organiziaotns's customer list
        // const cachePattern = `customers:organizationId:${req.body.organizationId}:*`;
        const cachePattern = `executionpartner:organizationId:${req.body.organizationId}*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(201).json({
            ok: true,
            message: 'Partner created okfully',
            data: vendor
        });

    } catch (error: any) {
        console.error('Error creating executionpartner:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


export const quickExecutionPartnerCreate = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { organizationId, firstName,
            companyName,
            category, email, phone, address } = req.body


        // Validate request body
        // const validationResult = validateCreateVendor(req.body);

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: 'organizationId is required' });
        }

        if (!firstName || firstName.trim() === '') {
            return res.status(400).json({ ok: false, message: 'First name is required' });
        }


        // Email validation (optional but must be valid if provided)
        if (email && email.trim() !== '') {
            if (!validateEmail(email)) {
                return res.status(400).json({ ok: false, message: 'Invalid email format' });
            }
        }

        // Phone validation (optional but must be valid if provided)
        if (phone) {
            if (phone.work && phone.work.trim() !== '') {
                const workPhone = phone.work.trim();
                const isOnlyDigits = /^\d+$/.test(workPhone);
                const isValidLength = workPhone.length >= 10 && workPhone.length <= 11;
                if (!isOnlyDigits || !isValidLength) {
                    // errors.push({ field: 'phone.work', message: 'Invalid work phone format' });
                    return res.status(400).json({ ok: false, message: 'Invalid work phone format. Must be 10 to 11 digits.' });

                }
            }

            if (phone.mobile && phone.mobile.trim() !== '') {
                if (!validatePhone(phone.mobile)) {
                    // errors.push({ field: 'phone.mobile', message: 'Invalid mobile phone format' });
                    return res.status(400).json({ ok: false, message: 'Invalid mobile phone format' });

                }
            }

            if (phone.whatsappNumber && phone.whatsappNumber.trim() !== '') {
                if (!validatePhone(phone.whatsappNumber)) {
                    // errors.push({ field: 'phone.mobile', message: 'Invalid whatsappNumber phone format' });
                    return res.status(400).json({ ok: false, message: 'Invalid whatsappNumber phone format' });

                }
            }
        }


        // Check if customer with same email already exists for this project
        if (email) {
            const existingCustomer = await ExecutionPartnerModel.findOne({
                email: email,
                // projectId: req.body.projectId
            });

            if (existingCustomer) {
                return res.status(409).json({
                    ok: false,
                    message: 'Partner with this email already exists'
                });
            }
        }

        // Create customer
        const vendor = new ExecutionPartnerModel({
            organizationId,
            firstName: firstName,
            email,
            category,
            phone,
            companyName,
            address
        });

        await vendor.save();

        const globalOrgPattern = `executionpartner:*organizationId:${organizationId}*`;

        const keys = await redisClient.keys(globalOrgPattern);

        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(201).json({
            ok: true,
            message: 'partners created ok fully from quick create',
            data: vendor
        });

    } catch (error: any) {
        console.error('Error creating partners from quick create:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const updateExecutionPartner = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid partners ID format'
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

        
        // Phone validation (if provided)
        if (req.body.phone) {
            // if (data.phone.work && data.phone.work.trim() !== '' && data.phone.work !== null) {
            //     if (!validatePhone(data.phone.work)) {
            //         errors.push({ field: 'phone.work', message: 'Invalid work phone format' });
            //     }
            // }
            if (req.body.phone.mobile && req.body.phone.mobile.trim() !== '' && req.body.phone.mobile !== null) {
                if (!validatePhone(req.body.phone.mobile)) {
                    res.status(400).json({ ok: false, message: 'Invalid mobile phone format' });
                }
            }
        }


        // Validate request body
        // const validationResult = validateUpdateVendor(req.body);

        // if (!validationResult.isValid) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: 'Validation failed',
        //         errors: validationResult.errors
        //     });
        // }

        // Check if customer exists
        const existingVendor = await ExecutionPartnerModel.findById(id);
        if (!existingVendor) {
            return res.status(404).json({
                ok: false,
                message: 'partners not found'
            });
        }

        // Check if email is being updated and if it's unique
        if (req.body.email && req.body.email !== existingVendor.email) {
            const duplicateEmail = await ExecutionPartnerModel.findOne({
                email: req.body.email,
                // projectId: existingVendor.projectId,
                _id: { $ne: id }
            });

            if (duplicateEmail) {
                return res.status(409).json({
                    ok: false,
                    message: 'partners with this email already exists'
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
        const updatedVendor = await ExecutionPartnerModel.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        // Invalidate cache
        const cacheKey = `executionpartner:${id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `customers:organizationId:${existingVendor.organizationId}:*`;
        const cachePattern = `executionpartner:organizationId:${req.body.organizationId}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'partners updated okfully',
            data: updatedVendor
        });

    } catch (error: any) {
        console.error('Error updating executionpartner:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};



export const updateExecutionPartnerMainImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { executionvendorId } = req.params;

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
        const updatedVendor = await ExecutionPartnerModel.findByIdAndUpdate(
            executionvendorId,
            { mainImage: mainImageObject },
            { new: true } // Return updated doc
        );

        if (!updatedVendor) {
            return res.status(404).json({
                ok: false,
                message: 'partners not found'
            });
        }

        const cacheKey = `executionpartner:${updatedVendor._id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `customers:organizationId:${existingVendor.organizationId}:*`;
        const cachePattern = `executionpartner:organizationId:${req.body.organizationId}*`;

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




export const updateExecutionPartnerDoc = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid partners ID format'
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
        const updatedVendor = await ExecutionPartnerModel.findByIdAndUpdate(
            id,
            { $push: { documents: { $each: documents } } }, // Use $each to push multiple documents
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.status(400).json({
                ok: false,
                message: 'partners not found',
            });
        }
        // Invalidate cache
        const cacheKey = `executionpartner:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `executionpartner:organizationId:${updatedVendor.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'partners updated okfully',
            data: updatedVendor
        });
    } catch (error: any) {
        console.error('Error updating partners:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}


export const updateExecutionPartnerShopImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { id } = req.params;

        // Validate vendor ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid partners ID format'
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
        const updatedVendor = await ExecutionPartnerModel.findByIdAndUpdate(
            id,
            { $push: { shopImages: { $each: shopImages } } }, // Use $each to push multiple documents
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.status(400).json({
                ok: false,
                message: 'partners not found',
            });
        }
        // Invalidate cache
        const cacheKey = `executionpartner:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `executionpartner:organizationId:${updatedVendor.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'partners shop images updated',
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
export const deleteExecutionPartner = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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
        const vendor = await ExecutionPartnerModel.findByIdAndDelete(id);
        if (!vendor) {
            return res.status(404).json({
                ok: false,
                message: 'vendor not found'
            });
        }

        // Invalidate cache
        const cacheKey = `executionpartner:${id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `executionpartner:organizationId:${vendor.organizationId}:*`;
        const cachePattern = `executionpartner:organizationId:${vendor?.organizationId?.toString()}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'partners deleted okfully'
        });

    } catch (error: any) {
        console.error('Error deleting executionpartner:', error);
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
export const getExecutionPartner = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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
        const cacheKey = `executionpartner:${id}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'partners fetched okfully (from cache)',
                data: JSON.parse(cachedData),
            });
        }

        // Fetch from database
        const vendor = await ExecutionPartnerModel.findById(id)
        // .populate('projectId', 'name')
        // .populate('clientId', 'name');

        if (!vendor) {
            return res.status(404).json({
                ok: false,
                message: 'partners not found'
            });
        }

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(vendor), { EX: 60 * 10 }); // cache for 10 min

        return res.status(200).json({
            ok: true,
            message: 'partners fetched okfully',
            data: vendor,

        });

    } catch (error: any) {
        console.error('Error fetching executionpartner:', error);
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
export const getAllExecutionPartner = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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
        const cacheKey = `executionpartner:organizationId:${organizationId || 'all'}:page:${pageNum}:limit:${limitNum}:search:${search || 'none'}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:sort:${sortBy}:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        //  await redisClient.del(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'partners fetched okfully (from cache)',
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
            ExecutionPartnerModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                // .populate('projectId', 'ProjectNAme')
                // .populate('clientId', 'clientName')
                .lean(),
            ExecutionPartnerModel.countDocuments(filter)
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
            message: 'partners fetched okfully',
            ...response,

        });

    } catch (error: any) {
        console.error('Error fetching executionpartner:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};




export const getAllExecutionPartnerDropDown = async (req: Request, res: Response): Promise<any> => {
    try {

        const { organizationId } = req.params
        const {
            priority
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
        const cacheKey = `executionpartner:dropdown:organizationId:${organizationId || 'all'}:pri:${priority || 'all'}`;

        // Check cache
        // await redisClient.del(cacheKey);
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'partners fetched okfully (from cache)',
                data: JSON.parse(cachedData),
            });
        }


        // Fetch vendors with pagination
        const vendors = await ExecutionPartnerModel.find(filter)
            .select('_id firstName companyName email address phone priority') // Only select needed fields
            .lean();

        let modifiedvendor = vendors.map(vendor => {
            return {
                _id: vendor._id,
                partnerName: `${vendor.firstName}`,
                firstName: vendor?.firstName,
                companyName: vendor?.companyName || "",
                email: vendor.email || "",
                address: vendor.address || "",
                phoneNo: vendor.phone?.work || vendor.phone?.mobile || "",
                work: vendor.phone?.work || "",
                mobile: vendor.phone?.mobile || "",
                priority: vendor?.priority || []
            }
        })


        // Cache the result
        await redisClient.set(cacheKey, JSON.stringify(modifiedvendor), { EX: 60 * 10 }); // 10 min


        return res.status(200).json({
            ok: true,
            message: 'partners fetched okfully',
            data: modifiedvendor
        });

    } catch (error: any) {
        console.error('Error fetching executionpartner:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}