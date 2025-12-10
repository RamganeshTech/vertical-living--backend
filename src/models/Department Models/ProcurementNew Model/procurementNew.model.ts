import mongoose, { Types, model, Schema } from "mongoose";
import { DeliveryLocationDetailsSchema, IPdfGenerator, OrderMaterialShopDetails, OrderMaterialSiteDetail, OrderSubItems, OrderSubItemSchema, pdfGeneratorSchema, ShopDetailsSchema } from "../../Stage Models/Ordering Material Model/OrderMaterialHistory.model";


export interface ProcurementOrderDetaisl extends OrderMaterialShopDetails {
  upiId?: string
}

export interface IProcurementNew {
  organizationId: Types.ObjectId,
  projectId: Types.ObjectId,
  shopDetails: ProcurementOrderDetaisl,
  deliveryLocationDetails: OrderMaterialSiteDetail,

  quoteNumber: number,
  fromDeptNumber: string;
  fromDeptRefId: Types.ObjectId;
  fromDeptModel: string;
  fromDeptName: string

  isConfirmedRate: boolean,
  procurementNumber: string;
  selectedUnits: IProcurementItemsNew[],
  totalCost: number
  refPdfId: string | null,
  procurementPdfs: IPdfGenerator[]
  generatedLink?: string
  isSyncWithPaymentsSection: boolean,
}

const ShopSchemaProcurement = new Schema<ProcurementOrderDetaisl>({
  ...ShopDetailsSchema.obj,
  upiId: { type: String, default: null },
})


export interface IProcurementItemsNew extends OrderSubItems {
  _id: Types.ObjectId
  rate: number,
  totalCost: number
}

const procurementItemSchema = new Schema<IProcurementItemsNew>({
  subItemName: { type: String, default: null },
  refId: { type: String, default: null },
  quantity: { type: Number, default: null },
  unit: { type: String, default: null },
  rate: { type: Number, default: 0 },  //entered by the shop keeper
  totalCost: { type: Number, default: 0 },
}, { _id: true });

const procurementPurchaseOrderSchema = new Schema<IProcurementNew>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", default: null },

  quoteNumber: { type: Number, default: null },  //store the shop quote number if provided.
  fromDeptNumber: { type: String, default: null },  //order mateiral history models pdfs unique number
  fromDeptRefId: { type: Schema.Types.ObjectId, refPath:"fromDeptModel", default: null },  //order mateiral history models pdfs unique number
  fromDeptName: { type: String, default: "Order Material" },
  fromDeptModel: { type: String, default: "OrderMaterialHistoryModel" },
  
  shopDetails: ShopSchemaProcurement,
  isConfirmedRate: {type:Boolean, default:false},
  deliveryLocationDetails: DeliveryLocationDetailsSchema,
  selectedUnits: { type: [procurementItemSchema], default: [] },
  totalCost: { type: Number, },
  procurementNumber: { type: String, default: null },
  refPdfId: { type: String, default: null },
  procurementPdfs: { type: [pdfGeneratorSchema], default: [] },
  generatedLink: { type: String, default: null },
  isSyncWithPaymentsSection: {
            type: Boolean,
            // default: false
        }
}, {
  timestamps: true
});


procurementPurchaseOrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.procurementNumber) {
    const currentYear = new Date().getFullYear();

    const lastDoc = await mongoose
      .model("ProcurementModelNew")
      .findOne({ organizationId: this.organizationId }, { procurementNumber: 1 })
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastDoc && lastDoc?.procurementNumber) {
      const match = lastDoc.procurementNumber.match(/(\d+)$/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }

    this.procurementNumber = `PRO-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});



const ProcurementModelNew = model("ProcurementModelNew", procurementPurchaseOrderSchema)

export default ProcurementModelNew


