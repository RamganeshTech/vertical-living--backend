import mongoose, { Schema, Document } from "mongoose";

interface MaterialCategoryDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string; // e.g., "Plywood", "Adhesive"
  fields: {
    key: string;   // e.g., "brand", "thickness", "rate", "notes"
    type: "string" | "number" | "boolean"; 
    required?: boolean;
  }[];
}

const MaterialCategorySchema = new Schema<MaterialCategoryDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", },
  name: { type: String, },
  fields: [
    {
      key: { type: String,  },
      type: { type: String,  default: "string" },
      required: { type: Boolean, default: false },
    },
  ],
}, { timestamps: true });

export const CategoryModel = mongoose.model<MaterialCategoryDoc>("MaterialCategoryModel", MaterialCategorySchema);



interface MaterialItemDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string | null;
  data: Record<string, any>; // flexible to match fields defined in category
}

const MaterialItemSchema = new Schema<MaterialItemDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel",  },
  categoryId: { type: Schema.Types.ObjectId, ref: "MaterialCategoryModel",  },
  categoryName:{type: String, default:null},
  data: { type: Schema.Types.Mixed,  }, // { brand: "Sharon GOLD-BWP", thickness: "19mm", rate: 159.75, notes: "Waterproof" }
}, { timestamps: true });

export const ItemModel = mongoose.model<MaterialItemDoc>("MaterialItemModel", MaterialItemSchema);
