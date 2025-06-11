import { model, Schema, Types } from "mongoose";

export interface MaterialItem {
  materialName: string;
  unit: string;
  unitPrice: number;
  materialQuantity: number;
  singleMaterialCost:number;
  vendor?: string;
  notes?: string;
}

export interface MaterialEstimate extends Document {
  materialListId: Types.ObjectId;
  materials: MaterialItem[];
  totalCost: number;
}


const MaterialItemSchema = new Schema<MaterialItem>(
  {
    materialName: { type: String, required: true },
    unit: { type: String, required: true },
    unitPrice: { type: Number },
    materialQuantity: { type: Number },
    singleMaterialCost: { type: Number },
    vendor: { type: String , default:null},
    notes: { type: String, default:null },
  },
  { _id: true, timestamps:true }
);

const MaterialEstimateSchema = new Schema<MaterialEstimate>(
  {
    materialListId: { type: Schema.Types.ObjectId, ref: "MaterialListModel", required: true },
    materials: { type: [MaterialItemSchema], default:[] },
    totalCost: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

MaterialEstimateSchema.index({materialListId:1})

const MaterialEstimateModel = model("MaterialEstimateModel", MaterialEstimateSchema)
export default MaterialEstimateModel;