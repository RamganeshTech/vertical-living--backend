import mongoose, { Schema, Document } from "mongoose";
import { MaterialCategoryDoc, MaterialItemDoc } from "./rateConfigAdmin.model";

interface ILabourWithMaterialCategory extends MaterialCategoryDoc {
  whatsIncluded: string | null
  whatsNotIncluded: string | null
  disclaimer: string | null
}

const MaterialWithLabourRateCategorySchema = new Schema<ILabourWithMaterialCategory>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  name: { type: String, },
  fields: [
    {
      key: { type: String, },
      type: { type: String, default: "string" },
      required: { type: Boolean, default: false },
    },
  ],

  whatsIncluded: { type: String, default: null },
  whatsNotIncluded: { type: String, default: null },
  disclaimer: { type: String, default: null },


}, { timestamps: true });

export const MaterialWithLabourRateCategoryModel = mongoose.model<MaterialCategoryDoc>("MaterialWithLabourRateCategoryModel", MaterialWithLabourRateCategorySchema);


interface IMaterialWithLabourRateItem extends MaterialItemDoc {
}


const MaterialWithLabourRateItemSchema = new Schema<IMaterialWithLabourRateItem>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  categoryId: { type: Schema.Types.ObjectId, ref: "MaterialWithLabourRateCategoryModel", default: null },
  categoryName: { type: String, default: null },
  data: { type: Schema.Types.Mixed, }, // { work: "aluminium", sqftrate: 200, notes: "Waterproof" }
}, { timestamps: true });

export const MaterialWithLabourRateItemModel = mongoose.model<IMaterialWithLabourRateItem>("MaterialWithLabourRateItemModel", MaterialWithLabourRateItemSchema);
