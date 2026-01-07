import mongoose, { Schema, Document } from "mongoose";
import { MaterialCategoryDoc, MaterialItemDoc } from "./rateConfigAdmin.model";

interface LabourCategoryDoc extends MaterialCategoryDoc {
}

const LabourCategorySchema = new Schema<LabourCategoryDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  name: { type: String, },
  fields: [
    {
      key: { type: String, },
      type: { type: String, default: "string" },
      required: { type: Boolean, default: false },
    },
  ],
}, { timestamps: true });

export const LabourRateCategoryModel = mongoose.model<MaterialCategoryDoc>("LabourRateCategoryModel", LabourCategorySchema);


interface LabourItemDoc extends MaterialItemDoc {
}


const LabourItemSchema = new Schema<LabourItemDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  categoryId: { type: Schema.Types.ObjectId, ref: "LabourRateCategoryModel", default:null},
  categoryName: { type: String, default: null },
  data: { type: Schema.Types.Mixed, }, // { brand: "Sharon GOLD-BWP", thickness: "19mm", rate: 159.75, notes: "Waterproof" }
}, { timestamps: true });

export const LabourRateModel = mongoose.model<LabourItemDoc>("LabourItemModel", LabourItemSchema);
