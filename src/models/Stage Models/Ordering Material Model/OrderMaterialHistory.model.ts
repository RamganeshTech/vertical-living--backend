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




export interface IOrderHistorytimer {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
}


export interface OrderMaterialSiteDetail {
    siteName: string,
    address: string,
    siteSupervisor: string,
    phoneNumber: string,
}

export interface OrderMaterialShopDetails {
    shopName: string | null,
    address: string | null,
    contactPerson: string | null,
    phoneNumber: string | null,
}


export interface OrderSubItems {
    subItemName: string,
    refId: string,
    quantity: number,
    unit: string,
}


export interface IOrderDimention {
    height: number;
    width: number;
    depth: number;
}
export interface OrderedMaterialSingle {
    unitId: Types.ObjectId | null;
    category: string | null; // e.g., "bedCot", "tv", etc.
    customId: string | null; // e.g., "bedCot", "tv", etc.
    image: string | null;
    subItems: OrderSubItems[];
    dimention: IOrderDimention | null
    unitName: string,
    quantity: number;
    singleUnitCost: number
}


export interface IPublicUnits {
    shopDetails: OrderMaterialShopDetails | null,
    subItems: OrderSubItems[]
}


export interface IOrderedMaterialHistory {
    _id?: Types.ObjectId;
    projectId: Types.ObjectId;
    status: "pending" | "completed";
    deliveryLocationDetails: OrderMaterialSiteDetail,
    shopDetails: OrderMaterialShopDetails,
    isEditable: boolean;
    selectedUnits: OrderedMaterialSingle[];
    publicUnits: IPublicUnits;
    publicUnitsVersion: number
    needsStaffReview: boolean
    images: IPdfGenerator[]

    totalCost: number;
    assignedTo: Types.ObjectId;
    timer: IOrderHistorytimer;
    generatedLink: IPdfGenerator[]
}

export interface IPdfGenerator extends Document {
    _id?: Types.ObjectId;   // unique id for each item
    url: string | null;
    refUniquePdf: string
    pdfName: string | null;
    status: string,
}

// Timer schema
const TimerSchema = new Schema<IOrderHistorytimer>({
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deadLine: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
}, { _id: false });





export const DeliveryLocationDetailsSchema = new Schema<OrderMaterialSiteDetail>({
    siteName: String,
    address: String,
    siteSupervisor: String,
    phoneNumber: String,
}, { _id: false });



export const ShopDetailsSchema = new Schema<OrderMaterialShopDetails>({
    shopName: String,
    address: String,
    contactPerson: String,
    phoneNumber: String,
}, { _id: false });



const DimentionSchema = new Schema<IOrderDimention>({
    height: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
})


export const pdfGeneratorSchema = new Schema<IPdfGenerator>({
    url: { type: String, default: null },
    refUniquePdf: { type: String, default: null },
    pdfName: { type: String, default: null },
    status: { type: String, default: "pending" } //delivered, shipped, ordered, cancelled, yet to order
}, { _id: true })



export const OrderSubItemSchema = new Schema<OrderSubItems>({
    subItemName: { type: String, default: null },
    refId: { type: String, default: null },
    quantity: { type: Number, default: null },
    unit: { type: String, default: null },
}, { _id: true })


export const PublicUnitsSchema = new Schema<IPublicUnits>({
    shopDetails: { type: ShopDetailsSchema, default: null },
    subItems: { type: [OrderSubItemSchema], default: [] },
}, { _id: false })


const orderedUnits = new Schema<OrderedMaterialSingle>({
    unitId: { type: Schema.Types.ObjectId }, // ID of BedCot, TVUnit, etc.
    category: { type: String },
    image: { type: String, default: null },
    customId: { type: String, default: null },
    quantity: { type: Number, default: 1 },
    unitName: { type: String, default: null },
    dimention: { type: DimentionSchema, default: null },
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
    shopDetails: ShopDetailsSchema,
    deliveryLocationDetails: DeliveryLocationDetailsSchema,
    timer: { type: TimerSchema, required: true },
    selectedUnits: { type: [orderedUnits], default: [] },

    publicUnits: { type: PublicUnitsSchema, default: {} },
    images:{ type: [pdfGeneratorSchema], default: [] },

    // ✨ NEW: Simple change tracking ✨
    publicUnitsVersion: { type: Number, default: 0 }, // Increment on each public change
    needsStaffReview: { type: Boolean, default: false }, // Flag for staff

    totalCost: { type: Number, },
    generatedLink: { type: [pdfGeneratorSchema], default: [] }
}, { timestamps: true });

OrderHistorySchema.index({ projectId: 1 })

// OrderHistorySchema.plugin(procurementLogger);

export const OrderMaterialHistoryModel = model("OrderMaterialHistoryModel", OrderHistorySchema);
