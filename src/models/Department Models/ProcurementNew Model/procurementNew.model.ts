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
  selectedUnits: IProcurementItemsNew[],
  totalCost: number
  refPdfId: string | null,
  procurementPdfs: IPdfGenerator[]
}

const ShopSchemaProcurement = new Schema<ProcurementOrderDetaisl>({
  ...ShopDetailsSchema.obj,
  upiId: { type: String, default: null },
})


interface IProcurementItemsNew extends OrderSubItems {
  rate: number,
  totalCost: number
}
const procurementItemSchema = new Schema<IProcurementItemsNew>({
  subItemName: { type: String, default: null },
  refId: { type: String, default: null },
  quantity: { type: Number, default: null },
  unit: { type: String, default: null },
  rate: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
}, { _id: true });

const procurementPurchaseOrderSchema = new Schema<IProcurementNew>({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", },
  shopDetails: ShopSchemaProcurement,
  deliveryLocationDetails: DeliveryLocationDetailsSchema,
  selectedUnits: { type: [procurementItemSchema], default: [] },
  totalCost: { type: Number, },
  refPdfId: { type: String, default: null },
  procurementPdfs: { type: [pdfGeneratorSchema], default: [] }
}, {
  timestamps: true
});


const ProcurementModelNew = model("ProcurementModelNew", procurementPurchaseOrderSchema)

export default ProcurementModelNew


