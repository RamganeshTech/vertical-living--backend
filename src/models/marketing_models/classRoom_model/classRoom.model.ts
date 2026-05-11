import { Schema, model } from 'mongoose';


import mongoose, { Document, Types } from 'mongoose';

// Defines the dynamic content formats
export interface IContentBlock {
  type: 'paragraph' | 'list' | 'heading' | 'callout';
  text?: string;        // Used for paragraphs, headings, or callouts
  listItems?: string[]; // Used specifically when type is 'list'
  url?: string;         // Used specifically when type is 'image'
  order: number;        // To maintain the sequence of content
}

// Defines the Tabs (sub-headings)
export interface ITab {
  _id?: Types.ObjectId;
  title: string;
  order: number;
  contentBlocks: IContentBlock[];
}

// Defines the Main Module (The Document)
export interface IClassRoomModel extends Document {
  organizationId: Types.ObjectId; // Crucial for your multi-tenant SaaS architecture
  moduleName: string;
  description?: string;
  tabs: ITab[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for individual content pieces inside a tab
const ContentBlockSchema = new Schema<IContentBlock>({
  type: { 
    type: String, 
    enum: ['paragraph', 'list', 'heading', 'callout',], 
    required: true 
  },
  text: { 
    type: String 
  },
  listItems: [{ 
    type: String 
  }],
  url: { 
    type: String 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { _id: true }); // Disable _id for blocks to keep the document lightweight

// Schema for the Tabs
const TabSchema = new Schema<ITab>({
  title: { 
    type: String, 
    required: true 
  },
  order: { 
    type: Number, 
    default: 0 
  },
  contentBlocks: [ContentBlockSchema]
}, {_id:true});

// Main Schema for the Guide Module
const ClassRoomSchema = new Schema<IClassRoomModel>({
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'OrganizationModel', // Update this to match your actual Tenant/Firm model name
    required: true,
  },
  moduleName: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  tabs: [TabSchema]
}, {
  timestamps: true // Automatically handles createdAt and updatedAt
});

// Compound index to ensure module names are unique per firm/tenant
ClassRoomSchema.index({ organizationId: 1 });

const ClassRoomModel = model<IClassRoomModel>('ClassRoomModel', ClassRoomSchema);

export default ClassRoomModel