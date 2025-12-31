
import { model, Schema, Types } from "mongoose";

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

export interface OrderMaterialShopDetails {
    shopName: String,
    address: String,
    contactPerson: String,
    phoneNumber: String,
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
// export interface OrderedMaterialSingle {
//     unitId: Types.ObjectId;
//     category: string; // e.g., "bedCot", "tv", etc.
//     customId: string; // e.g., "bedCot", "tv", etc.
//     image: string;
//     subItems: OrderSubItems[];
//     dimention: IOrderDimention
//     unitName: string,
//     quantity: number;
//     singleUnitCost: number
// }



export interface IOrderedItems {
    orderMaterialNumber: string,
    subItems: OrderSubItems[]
    shopDetails: OrderMaterialShopDetails | null;
    isPublicOrder: boolean
    deliveryLocationDetails: OrderMaterialSiteDetail;
    images: IPdfGenerator[]
    pdfLink: IPdfGenerator | null;
    isSyncWithProcurement: boolean,
    createdAt: Date
}



export interface ICurrentOrder {
    orderMaterialNumber: string;
    subItems: OrderSubItems[]
}

export interface ICommonOrderedMaterialHistory {
    _id?: Types.ObjectId;
    organizationId: Types.ObjectId;
    projectName: string;
    status: "pending" | "completed";
    deliveryLocationDetails: OrderMaterialSiteDetail,
    shopDetails: OrderMaterialShopDetails,
    isEditable: boolean;
    // selectedUnits: OrderedMaterialSingle[];

    images: IPdfGenerator[]
    currentOrder: ICurrentOrder

    orderedItems: IOrderedItems[]



    totalCost: number;
    assignedTo: Types.ObjectId;
    timer: IOrderHistorytimer;
    // pdfLink: IPdfGenerator[]
}

export interface IPdfGenerator extends Document {
    _id?: Types.ObjectId;   // unique id for each item
    url: string | null;
    refUniquePdf: string
    pdfName: string | null;
    status: string
}

// Timer schema
const TimerSchema = new Schema<IOrderHistorytimer>({
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deadLine: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
}, { _id: false });


const DeliveryLocationDetailsSchema = new Schema<OrderMaterialSiteDetail>({
    siteName: String,
    address: String,
    siteSupervisor: String,
    phoneNumber: String,
}, { _id: false });



const ShopDetailsSchema = new Schema<OrderMaterialShopDetails>({
    shopName: String,
    address: String,
    contactPerson: String,
    phoneNumber: String,
}, { _id: false });



// const DimentionSchema = new Schema<IOrderDimention>({
//     height: { type: Number, default: 0 },
//     width: { type: Number, default: 0 },
//     depth: { type: Number, default: 0 },
// })


const pdfGeneratorSchema = new Schema<IPdfGenerator>({
    url: { type: String, default: null },
    refUniquePdf: { type: String, default: null },
    pdfName: { type: String, default: null },
    status: { type: String, default: "pending" },
}, { _id: true })



const OrderSubItemSchema = new Schema<OrderSubItems>({
    subItemName: { type: String, default: null },
    refId: { type: String, default: null },
    quantity: { type: Number, default: null },
    unit: { type: String, default: null },
}, { _id: true })


// const orderedUnits = new Schema<OrderedMaterialSingle>({
//     unitId: { type: Schema.Types.ObjectId , default:null}, // ID of BedCot, TVUnit, etc.
//     category: { type: String },
//     image: { type: String, default: null },
//     customId: { type: String, default: null },
//     quantity: { type: Number, default: 1 },
//     unitName: { type: String, default: null },
//     dimention: { type: DimentionSchema, default: null },
//     singleUnitCost: { type: Number, default: 0 },
//     subItems: { type: [OrderSubItemSchema], default: [] }
// }, { _id: true })



const currentOrder = new Schema<ICurrentOrder>({
    orderMaterialNumber: { type: String, default: null },
    subItems: { type: [OrderSubItemSchema], default: [] },
}, { _id: true })



const orderedItems = new Schema<IOrderedItems>({
    orderMaterialNumber: { type: String, default: null },
    subItems: { type: [OrderSubItemSchema], default: [] },
    shopDetails: { type: ShopDetailsSchema, default: null },
    deliveryLocationDetails: { type: DeliveryLocationDetailsSchema, default: null },
    images: { type: [pdfGeneratorSchema], default: [] },
    pdfLink: { type: pdfGeneratorSchema, default: null },
    isSyncWithProcurement: { type: Boolean, default: false },
    isPublicOrder: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() }
}, { _id: true })


const CommonOrderHistorySchema = new Schema<ICommonOrderedMaterialHistory>({
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    projectName: { type: String, },
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
    // selectedUnits: { type: [orderedUnits], default: [] },
    currentOrder: { type: currentOrder, default: {} },

    orderedItems: { type: [orderedItems], default: [] },

    images: { type: [pdfGeneratorSchema], default: [] },


    totalCost: { type: Number, },
    // pdfLink: { type: [pdfGeneratorSchema], default: [] }
}, { timestamps: true });

CommonOrderHistorySchema.index({ projectId: 1 })

export const CommonOrderHistoryModel = model("CommonOrderHistoryModel", CommonOrderHistorySchema);
