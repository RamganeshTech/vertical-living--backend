import { model, Schema, Types } from "mongoose";

export interface ISelectedUnit {
  _id?: Types.ObjectId,
  unitId: Types.ObjectId;
  category: string; // e.g., "bedCot", "tv", etc.
  customId: string; // e.g., "bedCot", "tv", etc.
  quantity: number;
  image: string;
  singleUnitCost: number;
}

export interface ISelectedModularUnit {
  _id?: Types.ObjectId;
  projectId: Types.ObjectId;
  status: "pending" | "completed";
  selectedUnits: ISelectedUnit[];
  totalCost: number;
  createdAt?: Date;
  updatedAt?: Date;
}



const selectedUnits = new Schema<ISelectedUnit>({
  unitId: { type: Schema.Types.ObjectId }, // ID of BedCot, TVUnit, etc.
  category: {
    type: String,
    // enum: ["bedCot", "crockery", "tv", "wardrobe", "studyTable", "kitchenCabinet", "showcase", "falseCeiling", "shoeRack"],
  },
  image: { type: String, default: null },
  customId: { type: String, default: null },
  quantity: { type: Number, default: 1 },
  // 👇 cost for 1 unit (from master or overridden)
  singleUnitCost: { type: Number, default: 0 },
}, { _id: true })

const SelectedModularUnitSchema = new Schema<ISelectedModularUnit>({
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
  selectedUnits: { type: [selectedUnits], default: [] },
  totalCost: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
}, { timestamps: true });

export const SelectedModularUnitModel = model("SelectedModularUnitModel", SelectedModularUnitSchema);
