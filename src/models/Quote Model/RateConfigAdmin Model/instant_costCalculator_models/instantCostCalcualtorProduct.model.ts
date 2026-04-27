import mongoose, { Schema, Document } from "mongoose";

/** * Sub-Interfaces for specific cost blocks 
 */

interface IMaterialRow {
    brandId?: mongoose.Types.ObjectId;
    brandName?: string;
    itemName?: string;
    thickness?: string;
    rate: number;   
    quantity: number;
    totalCost: number;
}

// Special interface for Laminate since it has two faces
interface ILaminateFinish {
    inner: IMaterialRow[];
    outer: IMaterialRow[];
}

// Simple interface for finishes like PU, DU, Paint, Varnish
interface ISimpleFinish {
    rate: number;
    quantity: number;
    totalCost: number;
}


interface ILabourRow {
    categoryId?: mongoose.Types.ObjectId;
    rate: number;
    noOfDays: number;
    noOfPersons: number;
    totalCost: number;
}

interface IFabrication {
    sqftRate: number;
    areaSqft: number;
    totalCost: number;
}

/**
 * Main Product Document Interface
 */
export interface IInstantCostProduct extends Document {
    organizationId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId; // The MaterialCategory (where isProductSpecific: true)
    dimensionKey: string; // e.g., "6 x 7" or "6ft w x 7ft h"

    // Core Material Sections
    plywood: IMaterialRow[];
    // laminate: IMaterialRow;

    // Grouped Finishes
    finishes: {
        laminate: ILaminateFinish;
        pu: ISimpleFinish[];
        du: ISimpleFinish[];
        paint: ISimpleFinish[];
        varnish: ISimpleFinish[];
    };

    // Fittings & Consumables (Arrays of single rows as requested, or expandable)
    fittings: IMaterialRow[];
    nailsAndGlues: IMaterialRow[];

    // Services
    labour: ILabourRow;
    fabrication: IFabrication;

    // Final Aggregation
    totalProductAmount: number;
    lastUpdatedBy: mongoose.Types.ObjectId;
}

const InstantCostProductSchema = new Schema<IInstantCostProduct>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: "MaterialCategoryModel", required: true },
        dimensionKey: { type: String, }, // Extracted from Category fields

        // Plywood (Single Row Logic)
        plywood: [{
            brandId: { type: Schema.Types.ObjectId, default: null, ref: "MaterialItemModel" },
            brandName: { type: String },
            rate: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            totalCost: { type: Number, default: 0 },
        }],

        finishes: {
            laminate: {
                inner: [{
                    brandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
                    thickness: { type: String },
                    rate: { type: Number, default: 0 },
                    quantity: { type: Number, default: 0 },
                    totalCost: { type: Number, default: 0 },
                }],
                outer: [{
                    brandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
                    thickness: { type: String },
                    rate: { type: Number, default: 0 },
                    quantity: { type: Number, default: 0 },
                    totalCost: { type: Number, default: 0 },
                }]
            },
            pu: [{ rate: { type: Number, default: 0 }, quantity: { type: Number, default: 0 }, totalCost: { type: Number, default: 0 } }],
            du: [{ rate: { type: Number, default: 0 }, quantity: { type: Number, default: 0 }, totalCost: { type: Number, default: 0 } }],
            paint: [{ rate: { type: Number, default: 0 }, quantity: { type: Number, default: 0 }, totalCost: { type: Number, default: 0 } }],
            varnish: [{ rate: { type: Number, default: 0 }, quantity: { type: Number, default: 0 }, totalCost: { type: Number, default: 0 } }]
        },

        // Fittings (Array allowed here in case a dimension has multiple required fittings)
        fittings: [
            {
                brandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
                itemName: { type: String },
                rate: { type: Number, default: 0 },
                quantity: { type: Number, default: 0 },
                totalCost: { type: Number, default: 0 },
            },
        ],

        // Nails
        nailsAndGlues: [{
            itemName: { type: String, default: null },
            rate: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            totalCost: { type: Number, default: 0 },
        }],

        // Labour
        labour: {
            categoryId: { type: Schema.Types.ObjectId, default: null, ref: "LabourRateCategoryModel" },
            rate: { type: Number, default: 0 },
            noOfDays: { type: Number, default: 0 },
            noOfPersons: { type: Number, default: 0 },
            totalCost: { type: Number, default: 0 },
        },

        // Fabrication
        fabrication: {
            sqftRate: { type: Number, default: 0 },
            areaSqft: { type: Number, default: 0 },
            totalCost: { type: Number, default: 0 },
        },

        totalProductAmount: { type: Number, default: 0 },
        // lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
    },
    { timestamps: true }
);

// Indexing for faster lookups during automation
// InstantCostProductSchema.index({ organizationId: 1, categoryId: 1, dimensionKey: 1 });

export const InstantCostCalculatorProductModel = mongoose.model<IInstantCostProduct>(
    "InstantCostCalculatorProductModel",
    InstantCostProductSchema
);