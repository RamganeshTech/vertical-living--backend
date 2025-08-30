import { Schema, model, Document } from "mongoose";

import { Types } from "mongoose";

export interface IInventorySubItem {
    _id?: Types.ObjectId; // MongoDB will add this automatically
    itemName: string; // e.g., plywood, screws
    unit?: string | null; // kg, pcs, etc.
    totalQuantity: number;
    remainingQuantity: number;
    usedQuantity?: number;
    performedBy: Types.ObjectId; // dynamic reference
    createModel: string; // e.g., "StaffModel", "ClientModel"
    note?: string | null;
}

export interface IInventoryMain {
    _id?: Types.ObjectId;
    projectId: Types.ObjectId; // linked to ProjectModel
    subItems: IInventorySubItem[];
    createdAt?: Date;
    updatedAt?: Date;
}



const InventrorySubItemsSchema = new Schema<IInventorySubItem>({

    itemName: { type: String, }, // plywood, screws etc.
    unit: { type: String, default: null }, // kg, pcs, etc.
    totalQuantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    // usedQuantity: { type: Number, default: 0 },
    performedBy: { type: Schema.Types.ObjectId, refPath: "subItems.createModel", required: true },
    note: { type: String, default: null },
    createModel: { type: String, }

}, { _id: true })

const InventorySchema = new Schema<IInventoryMain>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", },

        subItems: { type: [InventrorySubItemsSchema], default: [] }
    },
    { timestamps: true }
);

InventorySchema.index({projectId: 1})

export const InventoryModel = model<IInventoryMain>("InventoryModel", InventorySchema);
