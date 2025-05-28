import { Schema, model, Types } from "mongoose";


export interface LabourItem {
  role: string;                   // e.g., Mason, Carpenter
  numberOfPeople: number;
  estimatedHours: number;
  hourlyRate: number;
  totalCost: number;
  notes?: string | null;
}

export interface LabourEstimate {
  labourListId: Types.ObjectId;   // references LabourList model
  labourItems: LabourItem[];
  totalLabourCost: number;
}


const LaborItemSchema = new Schema<LabourItem>(
  {
    role: { type: String, required: true }, // e.g. plumber, electrician
    numberOfPeople: { type: Number, required: true, default:0 },
    estimatedHours: { type: Number, required: true, default:0 },
    hourlyRate: { type: Number, required: true, default:0 },
    totalCost: { type: Number, default:0},
    notes: { type: String },
  },
  { _id: true, timestamps:true }
);

const LaborEstimateSchema = new Schema<LabourEstimate>(
  {
    labourListId: { type: Schema.Types.ObjectId, ref: "LaborListModel", required: true },
    labourItems: { type: [LaborItemSchema], default: [] },
    totalLabourCost: { type: Number, default:0 },
  },
  { timestamps: true }
);

export const LaborEstimateModel = model("LaborEstimateModel", LaborEstimateSchema);
