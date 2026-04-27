// controllers/categoryController.ts
import { Request, Response } from "express";
import { CategoryModel } from "../../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import { InstantCostCalculatorProductModel } from "../../../../models/Quote Model/RateConfigAdmin Model/instant_costCalculator_models/instantCostCalcualtorProduct.model";


export const isDimensionKey = (key: string): boolean => {
    // \d+(\.\d+)?  -> Matches integer or decimal numbers
    // [a-zA-Z\s]* -> Matches optional letters and spaces (like " ft w ")
    // [xX]         -> Matches 'x' or 'X'
    // const dimensionRegex = /\d+(\.\d+)?[a-zA-Z\s]*[xX][a-zA-Z\s]*\d+(\.\d+)?/i;
    // const dimensionRegex = /\d+(\.\d+)?\s*[a-zA-Z]*\s*[xX]\s*\d+(\.\d+)?\s*[a-zA-Z]*/i;
    const dimensionRegex = /^\s*\d+(\.\d+)?[a-zA-Z\s]*[xX][a-zA-Z\s]*\d+(\.\d+)?[a-zA-Z\s]*$/i;

    return dimensionRegex.test(key);
};



/**
 * @desc Get all categories where isProductSpecific is true
 * @route GET /api/categories/product-specific/:organizationId
 */
export const getProductSpecificCategories = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { isProductSpecific } = req.query

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        let filters: any = { organizationId: organizationId }

        // if (isProductSpecific) {
        if (isProductSpecific !== undefined) {
            // filters = {
            //     isProductSpecific: isProductSpecific
            // }
            filters.isProductSpecific = isProductSpecific === 'true';
        }

        const categories = await CategoryModel.find(filters) // Selecting basic info to keep payload light

        return res.status(200).json({
            ok: true,
            data: categories
        });
    } catch (error: any) {
        console.error("Error fetching product specific categories:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Failed to fetch product-specific categories"
        });
    }
};

/**
 * @desc Get only the dimension fields for a specific category
 * @route GET /api/categories/:categoryId/dimensions/:organizationId
 */
export const getCategoryDimensions = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, categoryId } = req.params;

        if (!organizationId || !categoryId) {
            return res.status(400).json({ ok: false, message: "Organization ID and Category ID are required" });
        }

        // Fetch the category
        const category = await CategoryModel.findOne({
            _id: categoryId,
            organizationId
        });

        if (!category) {
            return res.status(404).json({ ok: false, message: "Category not found" });
        }

        // Filter the fields array using the utility function
        const dimensionFields = category.fields.filter(field => isDimensionKey(field.key));

        return res.status(200).json({
            ok: true,
            categoryName: category.name,
            data: dimensionFields // Returns only the fields that are dimensions
        });

    } catch (error: any) {
        console.error("Error fetching category dimensions:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Failed to fetch category dimensions"
        });
    }
};


/**
 * @desc Create or Update an Instant Cost Calculator Product (Upsert)
 * @route POST /api/instant-cost-products/upsert
 */
export const upsertCostCalculatorProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Destructure top-level properties from req.body
        const {
            organizationId,
            categoryId,
            dimensionKey,
            plywood = [],
            finishes = {},
            fittings = [],
            nailsAndGlues = [],
            labour = {},
            fabrication = {},
            totalProductAmount = 0
        } = req.body;

        // 2. Validate required identifiers
        if (!organizationId || !categoryId || !dimensionKey) {
            return res.status(400).json({
                ok: false,
                message: "organizationId, categoryId, and dimensionKey are required."
            });
        }

        // 3. Explicitly construct the payload (Sanitization)
        const safePayload = {
            organizationId,
            categoryId,
            dimensionKey,

            // Map Plywood array
            plywood: plywood.map((p: any) => ({
                brandId: p.brandId || null,
                brandName: p.brandName || "",
                rate: Number(p.rate) || 0,
                quantity: Number(p.quantity) || 0,
                totalCost: Number(p.totalCost) || 0,
            })),

            // Map Finishes (Nested Arrays)
            finishes: {
                laminate: {
                    inner: (finishes.laminate?.inner || []).map((l: any) => ({
                        brandId: l.brandId || null,
                        thickness: l.thickness || "",
                        rate: Number(l.rate) || 0,
                        quantity: Number(l.quantity) || 0,
                        totalCost: Number(l.totalCost) || 0,
                    })),
                    outer: (finishes.laminate?.outer || []).map((l: any) => ({
                        brandId: l.brandId || null,
                        thickness: l.thickness || "",
                        rate: Number(l.rate) || 0,
                        quantity: Number(l.quantity) || 0,
                        totalCost: Number(l.totalCost) || 0,
                    }))
                },
                pu: (finishes.pu || []).map((f: any) => ({ rate: Number(f.rate) || 0, quantity: Number(f.quantity) || 0, totalCost: Number(f.totalCost) || 0 })),
                du: (finishes.du || []).map((f: any) => ({ rate: Number(f.rate) || 0, quantity: Number(f.quantity) || 0, totalCost: Number(f.totalCost) || 0 })),
                paint: (finishes.paint || []).map((f: any) => ({ rate: Number(f.rate) || 0, quantity: Number(f.quantity) || 0, totalCost: Number(f.totalCost) || 0 })),
                varnish: (finishes.varnish || []).map((f: any) => ({ rate: Number(f.rate) || 0, quantity: Number(f.quantity) || 0, totalCost: Number(f.totalCost) || 0 }))
            },

            // Map Fittings array
            fittings: fittings.map((f: any) => ({
                brandId: f.brandId || null,
                itemName: f.itemName || "",
                rate: Number(f.rate) || 0,
                quantity: Number(f.quantity) || 0,
                totalCost: Number(f.totalCost) || 0,
            })),

            // Map Nails & Glues array
            nailsAndGlues: nailsAndGlues.map((n: any) => ({
                itemName: n.itemName || "",
                rate: Number(n.rate) || 0,
                quantity: Number(n.quantity) || 0,
                totalCost: Number(n.totalCost) || 0,
            })),

            // Map Labour object
            labour: {
                categoryId: labour.categoryId || null,
                rate: Number(labour.rate) || 0,
                noOfDays: Number(labour.noOfDays) || 0,
                noOfPersons: Number(labour.noOfPersons) || 0,
                totalCost: Number(labour.totalCost) || 0,
            },

            // Map Fabrication object
            fabrication: {
                sqftRate: Number(fabrication.sqftRate) || 0,
                areaSqft: Number(fabrication.areaSqft) || 0,
                totalCost: Number(fabrication.totalCost) || 0,
            },

            totalProductAmount: Number(totalProductAmount) || 0,
        };

        // 4. Define the search criteria for the Upsert
        const filterQuery = {
            organizationId,
            categoryId,
            dimensionKey
        };

        // 5. Execute Upsert (Update if found, Insert if not found)
        const savedProduct = await InstantCostCalculatorProductModel.findOneAndUpdate(
            filterQuery,
            { $set: safePayload },
            {
                new: true,       // Return the updated document
                upsert: true,    // Create if it doesn't exist
                runValidators: true // Enforce schema validations
            }
        );

        return res.status(200).json({
            ok: true,
            message: "Configuration saved successfully",
            data: savedProduct
        });

    } catch (error: any) {
        console.error("Error upserting instant cost product:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Failed to save configuration"
        });
    }
};



/**
 * @desc Get configuration for a specific dimension of a product category
 * @route GET /api/instant-cost-products/:organizationId/:categoryId/:dimensionKey
 */
export const getCostCalculatorProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, categoryId, dimensionKey } = req.params;

        // 1. Validation
        if (!organizationId || !categoryId || !dimensionKey) {
            return res.status(400).json({
                ok: false,
                message: "Missing required parameters: organizationId, categoryId, or dimensionKey."
            });
        }

        // 2. Fetch the document and populate references if needed
        const config = await InstantCostCalculatorProductModel.findOne({
            organizationId,
            categoryId,
            dimensionKey
        })
            .populate('plywood.brandId')
            .populate('finishes.laminate.inner.brandId')
            .populate('finishes.laminate.outer.brandId')
            .populate('fittings.brandId')
            .populate('labour.categoryId');

        // 3. Handle case where no configuration has been saved yet
        if (!config) {
            return res.status(200).json({
                ok: true,
                message: "No existing configuration found for this dimension.",
                data: null
            });
        }

        // 4. Success Response
        return res.status(200).json({
            ok: true,
            data: config
        });

    } catch (error: any) {
        console.error("Error fetching instant cost product:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Internal server error while retrieving configuration"
        });
    }
};