import { Schema } from "mongoose";

export interface IKitchenRequirement {
    layoutType: "L-shaped" | "Straight" | "U-shaped" | "Parallel";
    measurements?: {
        top?: number;
        left?: number;
        right?: number;
    };
    kitchenPackage: "Essentials" | "Premium" | "Luxury" | "Build Your Own Package";
    // packageDetails?: {
    //     affordablePricing?: boolean;
    //     premiumDesigns?: boolean;
    //     elitePricing?: boolean;
    //     customDesign?: boolean;
    // };
    graniteCountertop?: boolean;
    numberOfShelves?: (number | null);
    notes?: string | null;
}


export const KitchenRequirementSchema = new Schema<IKitchenRequirement>({
    layoutType: {
        type: String,
        enum: ["L-shaped", "Straight", "U-shaped", "Parallel"],
        default: null
    },
    measurements: {
        A: { type: Number, required: false },
        B: { type: Number, required: false },
        C: { type: Number, required: false },
    },
    kitchenPackage: {
        type: String,
        enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
        default: null
    },
    graniteCountertop: {
        type: Boolean,
        default: null,
    },
    numberOfShelves: {
        type: Number,
        default: null
    },
    notes: {
        type: String, // for any custom client input
        default: null
    },
},
    {
        timestamps: true
    })




