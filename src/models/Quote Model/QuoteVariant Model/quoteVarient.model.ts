// models/MaterialQuote.js or .ts
import mongoose, { Types, Schema } from 'mongoose';
import { IFurniture, IMaterial, IMaterialQuote, ISimpleItem, SqftWorkSchema } from '../QuoteGenerate Model/InternalQuote.model';

export interface IQuoteVarientCoreItem extends IMaterial { }

export interface IQuoteFurniture extends IFurniture {
    plywoodBrand: string | null;
    // laminateBrand: string | null;
    innerLaminateBrand: string | null;
    outerLaminateBrand: string | null;
}

export interface IQuoteVarientMain extends IMaterialQuote {
    quoteId: Types.ObjectId | string
    brandName: string | null;
    innerLaminateBrand: string | null;
    outerLaminateBrand: string | null;
    pdfLink: IQuoteVarientUpload | null
    isBlured: boolean
    pdfType: templateTypePdf[]

}



export interface IQuoteVarientUpload {
    type: "pdf";
    url: string;
    originalName?: string;
    uploadedAt: Date
}

const uploadSchema = new Schema<IQuoteVarientUpload>({
    type: { type: String, enum: ["pdf"] },
    url: { type: String, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });


const QuoteMaterialSchema = new mongoose.Schema<IQuoteVarientCoreItem>({
    itemName: { type: String, default: null },
    imageUrl: { type: String, default: null },
    plywoodNos: {
        type: {
            quantity: { type: Number, default: null },
            thickness: { type: Number, default: null }
        },
        default: null
    },

    laminateNos: {
        type: {
            quantity: { type: Number, default: null },
            thickness: { type: Number, default: null }
        },
        default: null
    },



    innerLaminate: {
        type: {
            quantity: { type: Number, default: null },
            thickness: { type: Number, default: null }
        },
        default: null
    },


    outerLaminate: {
        type: {
            quantity: { type: Number, default: null },
            thickness: { type: Number, default: null }
        },
        default: null
    },

    carpenters: { type: Number, default: 0 },
    days: { type: Number, default: 0 },

    profitOnMaterial: { type: Number, default: 0 }, // in %
    profitOnLabour: { type: Number, default: 0 },   // in %

    rowTotal: { type: Number, default: 0 },
    remarks: { type: String, default: null }
}, { _id: true });



const QuoteSimpleItemSchema = new Schema<ISimpleItem>(
    {
        itemName: { type: String, default: null },
        description: { type: String, default: null },
        brandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
        brandName: { type: String, default: null },
        quantity: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        profitOnMaterial: { type: Number, default: 0 },
        rowTotal: { type: Number, default: 0 },
    },
    { _id: true }
);

// Each furniture entry
const QuoteFurnitureSchema = new mongoose.Schema<IQuoteFurniture>({
    furnitureName: { type: String, default: null },

    furnitureProfit: { type: Number, default: null },
    fabricationCost: { type: Number, default: null },

    coreMaterials: [QuoteMaterialSchema],
    fittingsAndAccessories: [QuoteSimpleItemSchema],
    glues: [QuoteSimpleItemSchema],
    nonBrandMaterials: [QuoteSimpleItemSchema],

    // Subtotals for each category
    coreMaterialsTotal: { type: Number, default: 0 },
    fittingsAndAccessoriesTotal: { type: Number, default: 0 },
    gluesTotal: { type: Number, default: 0 },
    nonBrandMaterialsTotal: { type: Number, default: 0 },

    furnitureTotal: { type: Number, default: 0 }, // Sum of all the above
    plywoodBrand: { type: String, default: null },
    // laminateBrand: { type: String, default: null },
    innerLaminateBrand: { type: String, default: null },
    outerLaminateBrand: { type: String, default: null },
}, { _id: true });



export interface templateTypePdf {
    templateType: string,
    pdf: IQuoteVarientUpload
}
const pdfType = new mongoose.Schema<templateTypePdf>({
    templateType: { type: String, default: null },
    pdf: {
        type: uploadSchema, default: null,
    }
}, { _id: true });


const QuoteVarientGenerateSchema = new mongoose.Schema<IQuoteVarientMain>({

    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    quoteNo: { type: String, default: null },
    quoteId: { type: Schema.Types.ObjectId, default: null, ref: "MaterialQuoteModel" },
    brandName: { type: String, default: null },
    innerLaminateBrand: { type: String, default: null },
    outerLaminateBrand: { type: String, default: null },

    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectModel',
    },
    isBlured: { type: Boolean, default: false },

    mainQuoteName: { type: String, default: null },
    quoteType: { type: String, default: null },


    quoteCategory: { type: String, default: null },

    furnitures: [QuoteFurnitureSchema],
    commonMaterials: { type: [QuoteSimpleItemSchema], default: [] },
    sqftRateWork: { type: [SqftWorkSchema], default: [] },

    commonProfitOverride: { type: Number, default: 0 },
    globalTransportation: { type: Number, default: 0 },
    globalProfitPercent: { type: Number, default: 0 },


    grandTotal: { type: Number, default: 0 },
    notes: { type: String, default: null },
    pdfLink: { type: uploadSchema, default: null },
    pdfType: { type: [pdfType], default: [], }
}, { timestamps: true });

const QuoteVarientGenerateModel = mongoose.model('QuoteVarientGenerateModel', QuoteVarientGenerateSchema);

export default QuoteVarientGenerateModel;

