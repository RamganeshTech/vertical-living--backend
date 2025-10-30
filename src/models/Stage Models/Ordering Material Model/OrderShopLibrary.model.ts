import { model, Schema, Types } from "mongoose";

export interface IOrderMaterialShopLib {
    organizationId: Types.ObjectId;
    shopName: string,
    address: string,
    contactPerson: string,
    phoneNumber: string,
}

const OrderShopDetailsSchema = new Schema<IOrderMaterialShopLib>({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "OrganizationModel" },
    shopName: { type: String, default: null,  },
    address: { type: String, default: null },
    contactPerson: { type: String, default: null },
    phoneNumber: { type: String, default: null },
}, { timestamps: true });

OrderShopDetailsSchema.index({ organizationId: 1 });

export const OrderShopDetailsLibModel = model("OrderShopDetailsModel", OrderShopDetailsSchema);
