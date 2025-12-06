// src/controllers/customerController.ts

import { Request, Response } from 'express';
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

        // // Convert string numbers to actual numbers
        // if (req.body.openingBalance && typeof req.body.openingBalance === 'string') {
        //     req.body.openingBalance = parseFloat(req.body.openingBalance);
        // }

        // // Convert string boolean to actual boolean
        // if (req.body.enablePortal !== undefined && typeof req.body.enablePortal === 'string') {
        //     req.body.enablePortal = req.body.enablePortal === 'true';
        // }

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
       const uploadedFiles = req.files as { [fieldname: string]: (Express.Multer.File & { location: string })[] };


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

        const documents: any[] = [];

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

        // Create customer
        const customer = new CustomerAccountModel({...req.body, documents});
        await customer.save();

        // Invalidate cache for the organiziaotns's customer list
        // const cachePattern = `customers:organizationId:${req.body.organizationId}:*`;
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

        // const cachePattern = `customers:organizationId:${existingCustomer.organizationId}:*`;
        // const cachePattern = `customers:*:organizationId:${req.body.organizationId}*`;

        // const keys = await redisClient.keys(cachePattern);
        // if (keys.length > 0) {
        //     await redisClient.del(keys);
        // }

        const cachePattern = `customers:organizationId:${req.body.organizationId}:*`;
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





export const updateCustomerMainImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { customerId } = req.params;

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
        const updatedCustomer = await CustomerAccountModel.findByIdAndUpdate(
            customerId,
            { mainImage: mainImageObject },
            { new: true } // Return updated doc
        );

        if (!updatedCustomer) {
            return res.status(404).json({
                ok: false,
                message: 'Vendor not found'
            });
        }

        const cacheKey = `customer:${updatedCustomer._id}`;
        await redisClient.del(cacheKey);

        // const cachePattern = `customers:organizationId:${existingVendor.organizationId}:*`;
        const cachePattern = `customer:organizationId:${req.body.organizationId}*`;

        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        return res.status(200).json({
            ok: true,
            message: 'cusotmer image updated successfully',
            data: {
                mainImage: updatedCustomer?.mainImage
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

        // const cachePattern = `customers:organizationId:${customer.organizationId}:*`;
        const cachePattern = `customers:organizationId:${customer?.organizationId?.toString()}*`;

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
            // .populate('projectId', 'name')
            // .populate('clientId', 'name');

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
            // customerType,
            createdFromDate ,
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

        // Validate customerType if provided
        // if (customerType && !['business', 'individual'].includes(customerType as string)) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: 'Invalid customer type. Must be "business" or "individual"'
        //     });
        // }

        // Build filter object
        const filter: any = {};

        if (organizationId) {
            filter.organizationId = organizationId;
        }

        if (projectId) {
            filter.projectId = projectId;
        }

        // if (customerType) {
        //     filter.customerType = customerType;
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
                // { lastName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'phone.work': { $regex: search, $options: 'i' } },
                { 'phone.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        // Create cache key based on filters
        const cacheKey = `customers:organizationId:${organizationId || 'all'}:page:${pageNum}:limit:${limitNum}:search:${search || 'none'}:createdFromDate:${createdFromDate || "all"}:createdToDate:${createdToDate || "all"}:sort:${sortBy}:${sortOrder}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        //  await redisClient.del(cacheKey);

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
                // customerType: customerType || null,
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




export const getAllCustomerDropDown = async (req: Request, res: Response): Promise<any> => {
 try {
        const {
            organizationId
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

       
        // Create cache key based on filters
        const cacheKey = `customers:dropdown:organizationId:${organizationId || 'all'}`;

        // Check cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                message: 'Customers fetched okfully (from cache)',
                data:JSON.parse(cachedData),
            });
        }

     
        // Fetch customers with pagination
        const customers = await CustomerAccountModel.find(filter).select('_id firstName lastName email') // Only select needed fields
            .lean();

        let modifiedCustomer = customers.map(user=> {
            return {
                _id: user._id, 
                customerName: `${user.firstName}`,
                email: user.email
            }
        })


         // Cache the result
        await redisClient.set(cacheKey, JSON.stringify(modifiedCustomer), { EX: 60 * 10 }); // 10 min

        
        return res.status(200).json({
            ok: true,
            message: 'Customers fetched okfully',
            data:modifiedCustomer
        });

    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}