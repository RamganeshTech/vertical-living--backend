import { Schema, model, Types } from "mongoose";

interface IRecycleMain {
        _id?: Types.ObjectId;
  projectId: Types.ObjectId;
  organizationId: Types.ObjectId;
    subItems: IRecycleItems[]
}



export interface IRecycleItems {
    _id?: Types.ObjectId; // MongoDB will add this automatically
    itemName: string; // e.g., plywood, screws
    unit: string | null; // kg, pcs, etc.
    remainingQuantity: number;
}



const RecycleSubItems = new Schema<IRecycleItems>({
itemName: { type: String,},
    remainingQuantity: { type: Number, default: 0 },
    unit: { type: String, default: null },
}, {_id:true}) 

const RecycleSchema = new Schema<IRecycleMain>(
  {
    organizationId:{type: Schema.Types.ObjectId, ref:"OrganizationModel"},
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
  subItems: {type: [RecycleSubItems], default:[]}
  },
  { timestamps: true }
);

export const RecycleModel = model("RecycleModel", RecycleSchema);
