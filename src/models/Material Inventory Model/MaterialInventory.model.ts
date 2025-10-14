import mongoose,  { Types } from "mongoose";

export interface IMaterialInventory extends Document {
  organizationId: Types.ObjectId;
  specification: Record<string, any>; // or a stricter type if needed
  createdAt: Date;
  updatedAt: Date;
}




const MaterialInventorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganizationModel",
      },
    // category: { type: String, default: "light" },
    // series: { type: String },
    // subcategory: { type: String },
    // model: { type: String },
    // itemCode: { type: String, index: true },
    // description: { type: String },
    // watt: { type: Number }, 
    // cct: { type: String },
    // mrp: { type: Number },
      // image : {type:String}
    // 👇 this allows unlimited custom fields
    specification: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);
export const MaterialInventoryModel = mongoose.model("MaterialInventoryModel",  MaterialInventorySchema);
