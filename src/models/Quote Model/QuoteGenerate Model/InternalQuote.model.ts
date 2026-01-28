// models/MaterialQuote.js or .ts
import mongoose, { Types, Schema } from 'mongoose';

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
  innerLaminate?: {
    quantity?: number | null;
    thickness?: number | null;
  } | null;

  outerLaminate?: {
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
  profitOnMaterial?: number
  rowTotal: number;
}

export interface IFurniture {
  furnitureName: string;
  furnitureProfit?: number
  fabricationCost?: number
  coreMaterials: IMaterial[];
  fittingsAndAccessories: ISimpleItem[];
  glues: ISimpleItem[];
  nonBrandMaterials: ISimpleItem[];

  coreMaterialsTotal: number;
  fittingsAndAccessoriesTotal: number;
  gluesTotal: number;
  nonBrandMaterialsTotal: number;

  furnitureTotal: number;

  plywoodBrandId: Types.ObjectId
  innerLaminateBrandId: Types.ObjectId
  outerLaminateBrandId: Types.ObjectId


}



export interface IWorkTemplate {
  templateName: string;  // e.g., "glass"
  templateData: any;
  singleTotal: number
}


export interface ISubLettingData {
  sections: [
    {
      sectionName: string,
      height: number
      width: number
      totalArea: number
    }
  ],
  allSectionTotalArea: number,
  vendorDetails: {
    worktimeline: number
    vendorName: string
    sqftRate: number,
    totalSqftRate: number
    finalQuoteRate: number
  }
}





// Define the structure for each Work item
export interface IWorkItem {
  workName: string;      // e.g., "Glass Partition"
  workType: string;      // e.g., "Glass Partition"
  subLettingData: ISubLettingData[];      // e.g., "Glass Partition"
  workTemplates: IWorkTemplate[]
  workTotal: number;     // Calculation for this specific work
}


export interface IMainInternalQuote {
  projectId: Types.ObjectId,
  mainQuoteName: string
  quoteCategory: string
  works: IWorkItem[]; // Array of multiple work specifications
}


export interface ISqftRate {
  // roomName: string
  works: [{
    workType: string,
    sqftRate: number,
    totalAreaSqft: {
      sections: [
        {
          height: number
          width: number
          multiplier: number,
          totalArea: number
        }
      ],
      totalArea: number
    }
    profit: number,
    totalCost: number
  }]
}

export interface IMaterialQuote extends Document {
  quoteNo: string | null;
  quoteType: string | null
  organizationId: Types.ObjectId;
  mainQuoteName: string | null,
  projectId: Types.ObjectId;
  furnitures: IFurniture[];
  commonMaterials: ISimpleItem[]
  commonProfitOverride: number,
  globalTransportation: number
  globalProfitPercent: number
  quoteCategory: string | null,
  grandTotal: number;
  notes?: string | null;

  plywoodBrandId: Types.ObjectId
  innerLaminateId: Types.ObjectId
  outerLaminateId: Types.ObjectId

  mainQuote: IMainInternalQuote
  sqftRateWork: ISqftRate[]

  createdAt?: Date
  updatedAt?: Date
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



const SimpleItemSchema = new Schema<ISimpleItem>(
  {
    itemName: { type: String, default: null },
    description: { type: String, default: null },
    quantity: { type: Number, default: 0 },
    profitOnMaterial: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    rowTotal: { type: Number, default: 0 },
  },
  { _id: true }
);

// Each furniture entry
const FurnitureSchema = new mongoose.Schema<IFurniture>({
  furnitureName: { type: String, default: null },
  furnitureProfit: { type: Number, default: null },
  fabricationCost: { type: Number, default: null },
  coreMaterials: [MaterialSchema],
  fittingsAndAccessories: [SimpleItemSchema],
  glues: [SimpleItemSchema],
  nonBrandMaterials: [SimpleItemSchema],

  // Subtotals for each category
  coreMaterialsTotal: { type: Number, default: 0 },
  fittingsAndAccessoriesTotal: { type: Number, default: 0 },
  gluesTotal: { type: Number, default: 0 },
  nonBrandMaterialsTotal: { type: Number, default: 0 },

  furnitureTotal: { type: Number, default: 0 },// Sum of all the above

  plywoodBrandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
  innerLaminateBrandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },
  outerLaminateBrandId: { type: Schema.Types.ObjectId, ref: "MaterialItemModel", default: null },


}, { _id: true });



//  START OF THE SQFT RATE WORK

// 1. The individual measurement sections (Length/Height x Width)
const SqftSectionSchema = new mongoose.Schema({
  height: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  multiplier: { type: Number, default: 0 },
  totalArea: { type: Number, default: 0 } // Result of height * width
}, { _id: true });

// 2. The specific work type (e.g., Tiling, Painting, False Ceiling)
export const SqftWorkSchema = new mongoose.Schema({
  workType: { type: String, default: "" },
  workId: { type: Types.ObjectId, ref: "MaterialWithLabourRateItemModel", default: null },// From your Material/Labour library
  sqftRate: { type: Number, default: 0 },
  sections: [SqftSectionSchema],           // Array of dimensions
  totalArea: { type: Number, default: 0 }, // Sum of all sections' totalArea
  profit: { type: Number, default: 0 },    // Room-level/Work-level profit override
  totalCost: { type: Number, default: 0 }  // (totalArea * sqftRate) + Profit
}, { _id: true });

// 3. The Room Grouping
// const SqftRateWorkSchema = new mongoose.Schema({
//   // roomName: { type: String, default: "Default Room" },
//   works: [SqftWorkSchema] // Array of different works in this room
// }, { _id: true });

//  END  OF THE SQFT RATE WORK


const subLettingSchema = new Schema<ISubLettingData>({
  sections: {
    type: [
      {
        sectionName: { type: String },
        height: { type: Number },
        width: { type: Number },
        totalArea: { type: Number }
      }
    ]
  },
  allSectionTotalArea: { type: Number },
  vendorDetails: {
    vendorName: { type: String },
    worktimeline: { type: Number },
    sqftRate: { type: Number },
    totalSqftRate: { type: Number },
    finalQuoteRate: { type: Number }
  }
}, { _id: true })

const workTemplates = new Schema<IWorkTemplate>({
  templateName: { type: String },
  templateData: { type: Schema.Types.Mixed, default: {} },
  singleTotal: { type: Number, }
}, { _id: true })

const WorkItemSchema = new Schema<IWorkItem>({
  workName: { type: String },
  workType: { type: String },
  subLettingData: { type: [subLettingSchema], default: [] },
  workTemplates: { type: [workTemplates], default: [] },
  workTotal: { type: Number, default: 0 }
}, { _id: true });


const mainQuote = new Schema<IMainInternalQuote>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectModel',
  },
  mainQuoteName: { type: String, default: null },
  quoteCategory: {
    type: String,
    default: null,
  },
  works: [WorkItemSchema]
})

const InternalQuoteSchema = new mongoose.Schema<IMaterialQuote>({
  quoteNo: { type: String, default: null },

  organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectModel',
  },
  mainQuoteName: { type: String, default: null },

  quoteType: { type: String, default: null },

  quoteCategory: {
    type: String,
    default: null,
  },

  plywoodBrandId: { type: Schema.Types.ObjectId, default: null },
  innerLaminateId: { type: Schema.Types.ObjectId, default: null },
  outerLaminateId: { type: Schema.Types.ObjectId, default: null },
  sqftRateWork: { type: [SqftWorkSchema], default: [] },
  furnitures: [FurnitureSchema],

  commonMaterials: { type: [SimpleItemSchema], default: [] },
  commonProfitOverride: { type: Number, default: 0 },

  globalTransportation: { type: Number, default: 0 },
  globalProfitPercent: { type: Number, default: 0 },

  mainQuote: { type: mainQuote, default: null },

  grandTotal: { type: Number, default: 0 },
  notes: { type: String, default: null }
}, { timestamps: true });


const InternalQuoteEntryModel = mongoose.model('MaterialQuoteModel', InternalQuoteSchema);

export default InternalQuoteEntryModel;