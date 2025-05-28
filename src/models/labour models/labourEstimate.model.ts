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


const LabourItemSchema = new Schema<LabourItem>(
  {
    role: { type: String, required: true }, // e.g. plumber, electrician
    numberOfPeople: { type: Number, required: true, default:0 },
    estimatedHours: { type: Number, required: true, default:0 },
    hourlyRate: { type: Number, required: true, default:0 },
    totalCost: { type: Number, default:0},
    notes: { type: String , default:null},
  },
  { _id: true, timestamps:true }
);

const LabourEstimateSchema = new Schema<LabourEstimate>(
  {
    labourListId: { type: Schema.Types.ObjectId, ref: "LabourListModel", required: true },
    labourItems: { type: [LabourItemSchema], default: [] },
    totalLabourCost: { type: Number, default:0 },
  },
  { timestamps: true }
);

export const LabourEstimateModel = model<LabourEstimate>("LabourEstimateModel", LabourEstimateSchema);
