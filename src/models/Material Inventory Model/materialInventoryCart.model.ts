import mongoose, { Schema, Document } from 'mongoose';

// Interface for a single cart item
export interface ICartItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    specification: any;
    singleItemCost: number;
    orderedBefore: boolean; // Track if this item was ordered before
}

// Interface for the cart
export interface IMaterialInventoryCart extends Document {
    organizationId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    items: ICartItem[];
    totalCost: number;
    status: 'pending' | 'ordered' | 'cancelled';
    pdfLink?: string;
    orderNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Schema for cart items
const CartItemSchema = new Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialInventoryModel',

    },
    quantity: {
        type: Number,
        default: 0
    },
    specification: {
        type: Schema.Types.Mixed,
    },
    singleItemCost: {
        type: Number,
        default: 0
    },
    orderedBefore: {
        type: Boolean,
        default: false
    }
});

const fileScheme = new Schema({
    type: { type: String, default: null },
    url: { type: String, default: null },
    originalName: { type: String, default: null },
    uploadedAt: {type: Date, default:new Date()}
}, { _id: true })

// Main Cart Schema
const MaterialInventoryCartSchema = new Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationModel',

    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectModel',

    },
    items: { type: [CartItemSchema], default: [] },
    totalCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'ordered', 'cancelled'],
        default: 'pending'
    },
    pdfLink: {
        type: fileScheme,
        default: null
    },
    orderNumber: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Create and export the model
const MaterialInventoryCartModel = mongoose.model<IMaterialInventoryCart>('MaterialInventoryCartModel', MaterialInventoryCartSchema);
export default MaterialInventoryCartModel;
