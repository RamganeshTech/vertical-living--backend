// models/MaterialQuote.js or .ts
import mongoose from 'mongoose';
const { Schema, Types } = mongoose;
const CategoryItemSchema = new Schema(
    {
        itemName: { type: String, default: null },
        imageUrl: { type: String, default: null },
        plywoodNos: { type: Number, default: 0 },
        laminateNos: { type: Number, default: 0 },
        carpenters: { type: Number, default: 0 },
        days: { type: Number, default: 0 },
        profitOnMaterial: { type: Number, default: 0 }, // in %
        profitOnLabour: { type: Number, default: 0 },   // in %
        rowTotal: { type: Number, default: 0 },
        remarks: { type: String, default: null },

        // ✅ Reference to material model to get price/sheet dynamically
        itemMaterialId: {
            type: Types.ObjectId,
            ref: "MaterialItemModel",
            default: null,
        },
    },
    { _id: false }
);

const SimpleItemSchema = new Schema(
    {
        itemName: { type: String, default: null },
        description: { type: String, default: null },
        quantity: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        rowTotal: { type: Number, default: 0 },
    },
    { _id: false }
);

const MaterialQuoteSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectModel',
    },

    // ✅ Main plywood section aka Category Section
    categorySections: { type: [CategoryItemSchema], default: [] },

    // ✅ Manual table sections
    fittings: { type: [SimpleItemSchema], default: [] },
    glues: { type: [SimpleItemSchema], default: [] },
    nonBrandedMaterials: { type: [SimpleItemSchema], default: [] },

    // totals
    plywoodTotal: { type: Number, default: 0 },
    fittingsTotal: { type: Number, default: 0 },
    glueTotal: { type: Number, default: 0 },
    nbmTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
});

const MaterialQuoteGenerateModel = mongoose.model('MaterialQuoteModel', MaterialQuoteSchema);

export default MaterialQuoteGenerateModel;