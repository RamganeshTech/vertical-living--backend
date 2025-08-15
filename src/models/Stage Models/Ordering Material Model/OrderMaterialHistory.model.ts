// import { model, Schema, Types } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";




// export interface IOrderHistorytimer {
//   startedAt: Date | null;
//   completedAt: Date | null;
//   deadLine: Date | null;
//   reminderSent: boolean
// }

// export interface OrderedMaterialSingle {
//     unitId: Types.ObjectId;
//     category: string; // e.g., "bedCot", "tv", etc.
//     customId: string; // e.g., "bedCot", "tv", etc.
//     quantity: number;
//     image: string;
//     singleUnitCost: number;
// }

// export interface IOrderedMaterialHistory {
//     _id?: Types.ObjectId;
//     projectId: Types.ObjectId;
//     status: "pending" | "completed";
//     isEditable: boolean;
//     selectedUnits: OrderedMaterialSingle[];
//     totalCost: number;
//      assignedTo: Types.ObjectId;

//       timer: IOrderHistorytimer;
//       generatedLink:string
// }





// // Timer schema
// const TimerSchema = new Schema<IOrderHistorytimer>({
//   startedAt: { type: Date, default: null },
//   completedAt: { type: Date, default: null },
//   deadLine: { type: Date, default: null },
//   reminderSent: { type: Boolean, default: false },
// }, { _id: false });

// const orderedUnits = new Schema<OrderedMaterialSingle>({
//     unitId: { type: Schema.Types.ObjectId }, // ID of BedCot, TVUnit, etc.
//     category: { type: String },
//     image: { type: String, default: null },
//     customId: { type: String, default: null },
//     quantity: { type: Number, default: 1 },
//     // 👇 cost for 1 unit (from master or overridden)
//     singleUnitCost: { type: Number, default: 0 },
// }, { _id: true })

// const OrderHistorySchema = new Schema<IOrderedMaterialHistory>({
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
//     status: { type: String, enum: ["pending", "completed"], default: "pending" },
//     isEditable: { type: Boolean, default: true },
//     assignedTo: {
//         type: Schema.Types.ObjectId,
//         ref: "StaffModel",
//         default: null,
//     },
//     timer: { type: TimerSchema, required: true },
//    selectedUnits: { type: [orderedUnits], default: [] },
//     totalCost: { type: Number, },
//     generatedLink: {type: String,}
// }, { timestamps: true });

// OrderHistorySchema.index({projectId:1})

// OrderHistorySchema.plugin(procurementLogger);

// export const OrderMaterialHistoryModel = model("OrderMaterialHistoryModel", OrderHistorySchema);




import { model, Schema, Types } from "mongoose";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";




export interface IOrderHistorytimer {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
}


export interface OrderMaterialSiteDetail {
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}


export interface OrderSubItems {
    subItemName: string,
    quantity: number,
    unit: string,
}

export interface OrderedMaterialSingle {
    unitId: Types.ObjectId;
    category: string; // e.g., "bedCot", "tv", etc.
    customId: string; // e.g., "bedCot", "tv", etc.
    image: string;
    subItems: OrderSubItems[];
    unitName:string,
    quantity: number;
    singleUnitCost: number
}

export interface IOrderedMaterialHistory {
    _id?: Types.ObjectId;
    projectId: Types.ObjectId;
    status: "pending" | "completed";
    deliveryLocationDetails: OrderMaterialSiteDetail,
    isEditable: boolean;
    selectedUnits: OrderedMaterialSingle[];
    totalCost: number;
    assignedTo: Types.ObjectId;
    timer: IOrderHistorytimer;
    generatedLink: string
}




const OrderSubItemSchema = new Schema<OrderSubItems>({
    subItemName: { type: String, default: null },
    quantity: { type: Number, default: null },
    unit: { type: String, default: null },
}, { _id: true })


const DeliveryLocationDetailsSchema = new Schema<OrderMaterialSiteDetail>({
  siteName: String,
  address: String,
  siteSupervisor: String,
  phoneNumber: String,
}, { _id: false });

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
    unitName:{type:String, default:null},
    singleUnitCost: { type: Number, default: 0 },
    subItems: { type: [OrderSubItemSchema], default: [] }
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
    deliveryLocationDetails: DeliveryLocationDetailsSchema,
    timer: { type: TimerSchema, required: true },
    selectedUnits: { type: [orderedUnits], default: [] },
    totalCost: { type: Number, },
    generatedLink: { type: String, }
}, { timestamps: true });

OrderHistorySchema.index({ projectId: 1 })

OrderHistorySchema.plugin(procurementLogger);

export const OrderMaterialHistoryModel = model("OrderMaterialHistoryModel", OrderHistorySchema);
