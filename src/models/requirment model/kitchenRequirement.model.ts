import { Schema } from "mongoose";

export interface IKitchenRequirement {
    layoutType: "L-shaped" | "Straight" | "U-shaped" | "Parallel";
    measurements?: {
        A?: number;
        B?: number;
        C?: number;
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
    notes?: string;
}


export const KitchenRequirementSchema = new Schema<IKitchenRequirement>({
    layoutType: {
        type: String,
        enum: ["L-shaped", "Straight", "U-shaped", "Parallel"],
    },
    measurements: {
        A: { type: Number, required: false },
        B: { type: Number, required: false },
        C: { type: Number, required: false },
    },
    kitchenPackage: {
        type: String,
        enum: ["Essentials", "Premium", "Luxury", "Build Your Own Package"],
    },
    // packageDetails: {
    //     affordablePricing: Boolean,
    //     premiumDesigns: Boolean,
    //     elitePricing: Boolean,
    //     customDesign: Boolean,
    // },
    graniteCountertop: {
        type: Boolean,
        default: false,
    },
    numberOfShelves: {
        type: Number,
        min: 0,
        default: null
    },
    notes: {
        type: String, // for any custom client input
    },
},
    {
        timestamps: true
    })




