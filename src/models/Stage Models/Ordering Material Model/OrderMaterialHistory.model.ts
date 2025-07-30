import { model, Schema, Types } from "mongoose";




export interface IOrderHistorytimer {
  startedAt: Date | null;
  completedAt: Date | null;
  deadLine: Date | null;
  reminderSent: boolean
}

export interface OrderedMaterialSingle {
    unitId: Types.ObjectId;
    category: string; // e.g., "bedCot", "tv", etc.
    customId: string; // e.g., "bedCot", "tv", etc.
    quantity: number;
    image: string;
    singleUnitCost: number;
}

export interface IOrderedMaterialHistory {
    _id?: Types.ObjectId;
    projectId: Types.ObjectId;
    status: "pending" | "completed";
    isEditable: boolean;
    selectedUnits: OrderedMaterialSingle[];
    totalCost: number;
     assignedTo: Types.ObjectId;
    
      timer: IOrderHistorytimer;
}





// Timer schema
const TimerSchema = new Schema<IOrderHistorytimer>({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
}, { _id: false });

const orderedUnits = new Schema<OrderedMaterialSingle>({
    unitId: { type: Schema.Types.ObjectId }, // ID of BedCot, TVUnit, etc.
    category: { type: String },
    image: { type: String, default: null },
    customId: { type: String, default: null },
    quantity: { type: Number, default: 1 },
    // 👇 cost for 1 unit (from master or overridden)
    singleUnitCost: { type: Number, default: 0 },
}, { _id: true })

const OrderHistorySchema = new Schema<IOrderedMaterialHistory>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "StaffModel",
        default: null,
    },
    timer: { type: TimerSchema, required: true },
   selectedUnits: { type: [orderedUnits], default: [] },
    totalCost: { type: Number, required: true },
}, { timestamps: true });


export const OrderMaterialHistoryModel = model("OrderMaterialHistoryModel", OrderHistorySchema);
