

// controllers/categoryController.ts
import { Request, Response } from "express";
import { InstantCostCalculatorMainModel } from "../../../../models/Quote Model/RateConfigAdmin Model/instant_costCalculator_models/instantCostCalculatorMain.model";
// import { InstantCostCalculatorProductModel } from "../../../../models/Quote Model/RateConfigAdmin Model/instant_costCalculator_models/instantCostCalcualtorProduct.model";

/**
 * @desc Create or Update an Instant Cost Calculator Product (Upsert)
 * @route POST /api/instant-cost-products/upsert
 */
export const upsertCostCalculatorMain = async (req: Request, res: Response):Promise<any> => {
    try {
        // 1. Destructure top-level properties from req.body
        const {
            organizationId,
            categoryId,
            dimension,
            plywood = [],
            finishes = {},
            fittings = [],
            nailsAndGlues = [],
            labour = {},
            fabrication = {},
            totalProductAmount = 0
        } = req.body;

        // 2. Validate required identifiers
        if (!organizationId) {
            return res.status(400).json({ 
                ok: false, 
                message: "organizationId are required." 
            });
        }

        // 3. Explicitly construct the payload (Sanitization)
        const safePayload = {
            organizationId,
            // categoryId,
            dimension,

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
        };

        // 5. Execute Upsert (Update if found, Insert if not found)
        const savedProduct = await InstantCostCalculatorMainModel.findOneAndUpdate(
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
 * @route GET /api/instant-cost-products/:organizationId/:categoryId/:dimension
 */
export const getCostCalculatorMain = async (req: Request, res: Response):Promise<any> => {
    try {
        const { organizationId } = req.params;

        // 1. Validation
        if (!organizationId) {
            return res.status(400).json({ 
                ok: false, 
                message: "Missing required parameters: organizationId" 
            });
        }

        // 2. Fetch the document and populate references if needed
        const config = await InstantCostCalculatorMainModel.findOne({
            organizationId,
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