import { model, Schema, Types } from "mongoose";

export interface MaterialItem {
  materialName: string;
  unit: string;
  unitPrice: number;
  materialQuantity: number;
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
    unitPrice: { type: Number, required: true },
    materialQuantity: { type: Number, required: true },
    vendor: { type: String , default:null},
    notes: { type: String, default:null },
  },
  { _id: false }
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


const MaterialEstimateModel = model("MaterialEstimateModel", MaterialEstimateSchema)
export default MaterialEstimateModel;