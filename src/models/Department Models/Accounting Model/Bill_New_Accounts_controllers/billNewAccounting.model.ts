import mongoose, { Schema, Document, Types } from 'mongoose';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface IUploadPdf {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}

// Interface for the Style Object
export interface IBillStyle {
    fontSize: number;
    color: string;
    backgroundColor: string;
    fontWeight: string;
    textAlign: string; // 'left' | 'center' | 'right'
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    padding: number;


    width: number,
    height:any
}

// Interface for the Component (Field)
export interface IBillComponent {
    id: string;
    type: 'text' | 'table' | 'image' | 'date' | "data-field";
    label: string;
    value: any; // Can be string, number, or array (for tables)
    isVisible: boolean;
    order: number;
    style: IBillStyle;

    x:number,
    y:number,

    columnWidths: number[],
    rowHeights: number[]
}

// Interface for the Section (Row)
export interface IBillSection {
    id: string;
    name: string;
    order: number;
    components: IBillComponent[];
    style: IBillStyle;
}

// Interface for the Template Document
export interface ITemplateBill extends Document {
    organizationId: Types.ObjectId
    templateName: string;
    isDefault: boolean;
    layout: IBillSection[];
    pdfData:IUploadPdf
    createdAt: Date;
    updatedAt: Date;
}

// Interface for the Bill/Invoice Document
export interface IBillNew extends Document {
    projectId: Types.ObjectId | null
    organizationId: Types.ObjectId
    billNumber: string;
    customerName: string;
    customerId: Types.ObjectId;
    layout: IBillSection[];
    pdfData:IUploadPdf
    createdAt: Date;
    updatedAt: Date;
}


// ==========================================
// 2. MONGOOSE SCHEMAS
// ==========================================

// A. Style Definition
const StyleBillSchema = new Schema<IBillStyle>({
    fontSize: { type: Number, default: 12 },
    color: { type: String, default: '#000000' },
    backgroundColor: { type: String, default: 'transparent' },
    fontWeight: { type: String, default: 'normal' },
    textAlign: { type: String, default: 'left' },

    // Spacing Controls
    marginTop: { type: Number, default: 0 },
    marginBottom: { type: Number, default: 0 },
    marginLeft: { type: Number, default: 0 },
    marginRight: { type: Number, default: 0 },
    padding: { type: Number, default: 0 },


     // --- NEW FIELDS FOR CANVAS RESIZING ---
    width: { type: Number, default: null }, 
    height: { type: Schema.Types.Mixed, default: null } // Mixed because it can be "auto" or a Number

}, { _id: false });


// B. Component Definition
const ComponentBillSchema = new Schema<IBillComponent>({
    id: { type: String },
    type: {
        type: String,
      enum: ['text', 'table', 'image', 'data-field'] 
    },
    label: { type: String },
    value: { type: Schema.Types.Mixed }, // Use Mixed for flexible data

    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

       // --- NEW FIELDS FOR ABSOLUTE POSITIONING ---
    x: { type: Number, default: 0 }, 
    y: { type: Number, default: 0 },

    // --- NEW FIELDS FOR TABLE CONFIG ---
    columnWidths: { type: [Number], default: [] }, // Stores percentage widths
    rowHeights: { type: [Number], default: [] },   // Stores pixel heights


    style: StyleBillSchema

}, { _id: false });


// C. Section Definition
const SectionBillSchema = new Schema<IBillSection>({
    id: { type: String },
    name: { type: String },
    order: { type: Number, default: 0 },

    components: [ComponentBillSchema],
    style: StyleBillSchema
}, { _id: false });


// ==========================================
// 3. MAIN COLLECTIONS
// ==========================================



const pdfGeneratorSchema = new Schema<IUploadPdf>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String,  },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
}, {_id: true});

// Template Schema
const TemplateBillSchema = new Schema<ITemplateBill>({
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    templateName: { type: String },
    isDefault: { type: Boolean, default: false },
    layout: [SectionBillSchema],
    pdfData: {type: pdfGeneratorSchema, default: null}
}, { timestamps: true });

// Bill (Invoice) Schema
const BillNewSchema = new Schema<IBillNew>({
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel" },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" , default:null},
    billNumber: { type: String },
    customerId: {type:Schema.Types.ObjectId, ref:"CustomerAccountModel", default:null},
    customerName: { type: String },
    layout: [SectionBillSchema],
    pdfData: {type: pdfGeneratorSchema, default: null}
}, { timestamps: true });


// ==========================================
// 4. EXPORT MODELS
// ==========================================

export const TemplateBillModel = mongoose.model<ITemplateBill>('TemplateBillModel', TemplateBillSchema);
export const BillNewModel = mongoose.model<IBillNew>('BillNewModel', BillNewSchema);