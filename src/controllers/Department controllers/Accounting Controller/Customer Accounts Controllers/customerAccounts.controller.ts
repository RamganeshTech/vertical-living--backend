// src/controllers/customerController.ts

import { Response } from 'express';
import {
    validateCreateCustomer,
    validateUpdateCustomer,
    validateMongoId
} from './customerAccoutsValidation';
import redisClient from '../../../../config/redisClient';
import CustomerAccountModel from '../../../../models/Department Models/Accounting Model/customerAccount.model';
import { RoleBasedRequest } from '../../../../types/types';

/**
 * Create a new customer
 * POST /api/customers
 */
export const createCustomer = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        if (req.body.phone && typeof req.body.phone === 'string') {
            req.body.phone = JSON.parse(req.body.phone);
        }

        // Convert string numbers to actual numbers
        if (req.body.openingBalance && typeof req.body.openingBalance === 'string') {
            req.body.openingBalance = parseFloat(req.body.openingBalance);
        }

        // Convert string boolean to actual boolean
        if (req.body.enablePortal !== undefined && typeof req.body.enablePortal === 'string') {
            req.body.enablePortal = req.body.enablePortal === 'true';
        }

        // Validate request body
        const validationResult = validateCreateCustomer(req.body);

        if (!validationResult.isValid) {
            return res.status(400).json({
                ok: false,
                message: 'Validation failed',
                errors: validationResult.errors
            });
        }

        // Check if customer with same email already exists for this project
        if (req.body.email) {
            const existingCustomer = await CustomerAccountModel.findOne({
                email: req.body.email,
                projectId: req.body.projectId
            });

            if (existingCustomer) {
                return res.status(409).json({
                    ok: false,
                    message: 'Customer with this email already exists in this project'
                });
            }
        }

        // Handle uploaded files (if any)
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

        // Create customer
        const customer = new CustomerAccountModel({...req.body, documents});
        await customer.save();

        // Invalidate cache for the project's customer list
        const cachePattern = `customers:organizationId:${req.body.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(201).json({
            ok: true,
            message: 'Customer created okfully',
            data: customer
        });

    } catch (error: any) {
        console.error('Error creating customer:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update a customer
 * PUT /api/customers/:id
 */
export const updateCustomer = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate customer ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid customer ID format'
            });
        }


        if(req.body?.documents){
             return res.status(400).json({
                ok: false,
                message: 'Document field is not allowed'
            });
        }
        // Validate request body
        const validationResult = validateUpdateCustomer(req.body);

        if (!validationResult.isValid) {
            return res.status(400).json({
                ok: false,
                message: 'Validation failed',
                errors: validationResult.errors
            });
        }

        // Check if customer exists
        const existingCustomer = await CustomerAccountModel.findById(id);
        if (!existingCustomer) {
            return res.status(404).json({
                ok: false,
                message: 'Customer not found'
            });
        }

        // Check if email is being updated and if it's unique
        if (req.body.email && req.body.email !== existingCustomer.email) {
            const duplicateEmail = await CustomerAccountModel.findOne({
                email: req.body.email,
                // projectId: existingCustomer.projectId,
                _id: { $ne: id }
            });

            if (duplicateEmail) {
                return res.status(409).json({
                    ok: false,
                    message: 'Customer with this email already exists in this project'
                });
            }
        }

        // Update customer
        const updatedCustomer = await CustomerAccountModel.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        // Invalidate cache
        const cacheKey = `customer:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `customers:organizationId:${existingCustomer.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Customer updated okfully',
            data: updatedCustomer
        });

    } catch (error: any) {
        console.error('Error updating customer:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


export const updateCustomerDoc= async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

          const { id } = req.params;

        // Validate customer ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid customer ID format'
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
        
          // Update customer - push documents to array
        const updatedCustomer = await CustomerAccountModel.findByIdAndUpdate(
            id,
            { $push: { documents: { $each: documents } } }, // Use $each to push multiple documents
            { new: true, runValidators: true }
        );

        if(!updatedCustomer){
             return res.status(400).json({
            ok: false,
            message: 'Customer not found',
        });
        }
          // Invalidate cache
        const cacheKey = `customer:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `customers:organizationId:${updatedCustomer.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Customer updated okfully',
            data: updatedCustomer
        });

    } catch (error: any) {
        console.error('Error updating customer:', error);
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
export const deleteCustomer = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate customer ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid customer ID format'
            });
        }

        // Delete customer
        const customer = await CustomerAccountModel.findByIdAndDelete(id);
        if (!customer) {
            return res.status(404).json({
                ok: false,
                message: 'Customer not found'
            });
        }

        // Invalidate cache
        const cacheKey = `customer:${id}`;
        await redisClient.del(cacheKey);

        const cachePattern = `customers:organizationId:${customer.organizationId}:*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'Customer deleted okfully'
        });

    } catch (error: any) {
        console.error('Error deleting customer:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
/**
 * Get single customer with Redis caching
 * GET /api/customers/:id
 */
export const getCustomer = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validate customer ID
        if (!validateMongoId(id)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid customer ID format'
            });
        }

        // Check cache
        const cacheKey = `customer:${id}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'Customer fetched okfully (from cache)',
                data: JSON.parse(cachedData),
            });
        }

        // Fetch from database
        const customer = await CustomerAccountModel.findById(id)
            .populate('projectId', 'name')
            .populate('clientId', 'name');

        if (!customer) {
            return res.status(404).json({
                ok: false,
                message: 'Customer not found'
            });
        }

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(customer), { EX: 60 * 10 }); // cache for 10 min

        return res.status(200).json({
            ok: true,
            message: 'Customer fetched okfully',
            data: customer,

        });

    } catch (error: any) {
        console.error('Error fetching customer:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all customers with pagination and filters
 * GET /api/customers
 * Query params: page, limit, projectId, firstName, lastName, customerType, search
 */
export const getAllCustomers = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            page = '1',
            limit = '10',
            organizationId,
            projectId,
            // firstName,
            // lastName,
            customerType,
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

        // Validate customerType if provided
        if (customerType && !['business', 'individual'].includes(customerType as string)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid customer type. Must be "business" or "individual"'
            });
        }

        // Build filter object
        const filter: any = {};

        if (organizationId) {
            filter.organizationId = organizationId;
        }

        if (projectId) {
            filter.projectId = projectId;
        }

        if (customerType) {
            filter.customerType = customerType;
        }

        // if (firstName) {
        //     filter.firstName = { $regex: firstName, $options: 'i' };
        // }

        // if (lastName) {
        //     filter.lastName = { $regex: lastName, $options: 'i' };
        // }

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
        const cacheKey = `customers:organizationId:${organizationId || 'all'}:page:${pageNum}:limit:${limitNum}:type:${customerType || 'all'}:search:${search || 'none'}:sort:${sortBy}:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'Customers fetched okfully (from cache)',
                ...JSON.parse(cachedData),

            });
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

        // Calculate skip
        const skip = (pageNum - 1) * limitNum;

        // Fetch customers with pagination
        const [customers, totalCount] = await Promise.all([
            CustomerAccountModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                // .populate('projectId', 'ProjectNAme')
                // .populate('clientId', 'clientName')
                .lean(),
            CustomerAccountModel.countDocuments(filter)
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const response = {
            data: customers,
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
                customerType: customerType || null,
                // firstName: firstName || null,
                // lastName: lastName || null,
                search: search || null
            }
        };

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 }); // cache for 10 min

        return res.status(200).json({
            ok: true,
            message: 'Customers fetched okfully',
            ...response,

        });

    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
