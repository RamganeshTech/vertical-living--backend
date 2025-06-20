





import mongoose, { Schema, Types } from "mongoose"

// Import individual sub-schemas
import { IKitchenRequirement, KitchenRequirementSchema } from "./kitchenRequirement.model"
import { IWardrobeRequirement, WardrobeRequirementSchema } from "./wardrobe.model"
import { BedroomRequirementSchema, IBedroomRequirement } from "./bedroom.model"
import { ILivingHallRequirement, LivingHallRequirementSchema } from "./livingroom.model"


interface IRequirementFormSchema extends Document {
  projectId: Types.ObjectId,
  clientData: {
    clientName: string,
    email: string,
    whatsapp: string,
    location: string
  },
  isEditable: boolean,
  kitchen: IKitchenRequirement,
  livingHall: ILivingHallRequirement,
  bedroom: IBedroomRequirement,
  wardrobe: IWardrobeRequirement,
  additionalNotes: string | null,
  status: "locked" | "pending" | "completed",
  clientConfirmed: boolean,
  shareToken: string,
  shareTokenExpiredAt: Date | null,
  timer: {
    startedAt: Date | null,
    completedAt: Date | null,
    deadLine: Date | null
  },
  uploads: {
      url: string,
      uploadedAt: Date,
      originalName: string,
    }[]
  
}

const RequirementFormSchema = new Schema<IRequirementFormSchema>(
  {
    // Track which project and client this is for
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectModel",
      required: true,
    },
    clientData: {
      clientName: { type: String },
      email: { type: String },
      whatsapp: { type: String },
      location: { type: String },
    },
    isEditable: {
      type: Boolean,
      default: true, // CTO, Owner, or Staff can lock it later
    },
    // Section-wise embedded forms
    kitchen: {
      type: KitchenRequirementSchema,
      required: false,
    },
    wardrobe: {
      type: WardrobeRequirementSchema,
      required: false,
    },
    bedroom: {
      type: BedroomRequirementSchema,
      required: false,
    },
    livingHall: {
      type: LivingHallRequirementSchema,
      required: false,
    },
    additionalNotes: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: "pending"
    },
    shareToken: {
      type: String,
      required: true,
      unique: true,
    },
    shareTokenExpiredAt: {
      type: Date,
      default: null, // Set only if needed
    },
    clientConfirmed: {
      type: Boolean,
      default: false
    },
    timer:{
      startedAt: {type : Date, default: null},
      completedAt: {type: Date, default: null},
      deadLine: {type: Date, default: null},
    },
    uploads: [
    {
      type: { type: String, enum: ["image", "pdf"] },
      url: String,
       originalName: { type: String, required: true }, 
      uploadedAt: { type: Date, default: new Date() }
    }
  ],

  },
  { timestamps: true }
)

export const RequirementFormModel = mongoose.model<IRequirementFormSchema>("RequirementFormModel", RequirementFormSchema)
