import mongoose, { Schema, Document } from "mongoose";

export interface MaterialItemVersionDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  materialType?: string
  itemId: mongoose.Types.ObjectId; // Reference to the original item being updated
  categoryName: string | null;
  data: Record<string, any>; // Snapshot of the previous data
}

const MaterialItemVersionSchema = new Schema<MaterialItemVersionDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "MaterialCategoryModel" },
  materialType:{type:String, default:null},
  itemId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel" },
  categoryName: { type: String, default: null },
  data: { type: Schema.Types.Mixed,  }, // The historical data
}, { timestamps: true }); // timestamps will track WHEN this version was archived

export const ItemVersionModel = mongoose.model<MaterialItemVersionDoc>(
  "MaterialItemVersionModel", 
  MaterialItemVersionSchema
);