// models/MaterialQuote.js or .ts
import mongoose, {Types, Schema} from 'mongoose';

export interface IMaterial {
  itemName?: string | null;
  imageUrl?: string | null;
  plywoodNos?: {
    quantity?: number | null;
    thickness?: number | null;
  } | null;
  laminateNos?: {
    quantity?: number | null;
    thickness?: number | null;
  } | null;
  carpenters?: number;
  days?: number;
  profitOnMaterial?: number;
  profitOnLabour?: number;
  rowTotal?: number;
  remarks?: string | null;
}



export interface ISimpleItem {
  itemName: string | null;
  description: string | null;
  quantity: number;
  cost: number;
  rowTotal: number;
}

export interface IFurniture {
  furnitureName: string;

  coreMaterials: IMaterial[];
  fittingsAndAccessories: ISimpleItem[];
  glues: ISimpleItem[];
  nonBrandMaterials: ISimpleItem[];

  coreMaterialsTotal: number;
  fittingsAndAccessoriesTotal: number;
  gluesTotal: number;
  nonBrandMaterialsTotal: number;

  furnitureTotal: number;

    
}

export interface IMaterialQuote extends Document {
  quoteNo: string | null;
  organizationId: Types.ObjectId;
  projectId: Types.ObjectId;
  furnitures: IFurniture[];
  grandTotal: number;
  notes?: string | null;
}


const MaterialSchema = new mongoose.Schema<IMaterial>({
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

    carpenters: { type: Number, default: 0 },
    days: { type: Number, default: 0 },

    profitOnMaterial: { type: Number, default: 0 }, // in %
    profitOnLabour: { type: Number, default: 0 },   // in %

    rowTotal: { type: Number, default: 0 },
    remarks: { type: String, default: null }
}, {_id:true});



const SimpleItemSchema = new Schema<ISimpleItem>(
    {
        itemName: { type: String, default: null },
        description: { type: String, default: null },
        quantity: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        rowTotal: { type: Number, default: 0 },
    },
    { _id: true }
);

// Each furniture entry
const FurnitureSchema = new mongoose.Schema<IFurniture>({
    furnitureName: { type: String, default: null},

    coreMaterials: [MaterialSchema],
    fittingsAndAccessories: [SimpleItemSchema],
    glues: [SimpleItemSchema],
    nonBrandMaterials: [SimpleItemSchema],

    // Subtotals for each category
    coreMaterialsTotal: { type: Number, default: 0 },
    fittingsAndAccessoriesTotal: { type: Number, default: 0 },
    gluesTotal: { type: Number, default: 0 },
    nonBrandMaterialsTotal: { type: Number, default: 0 },

    furnitureTotal: { type: Number, default: 0 } ,// Sum of all the above
}, {_id:true});

const InternalQuoteSchema = new mongoose.Schema<IMaterialQuote>({

    quoteNo: { type: String, default: null },

    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectModel',
    },
    furnitures: [FurnitureSchema],
    grandTotal: { type: Number, default: 0 },
    notes: { type: String, default: null }
}, {timestamps: true});


const MaterialQuoteGenerateModel = mongoose.model('MaterialQuoteModel', InternalQuoteSchema);

export default MaterialQuoteGenerateModel;