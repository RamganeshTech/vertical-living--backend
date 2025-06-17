





import mongoose, { Schema, Types } from "mongoose"

// Import individual sub-schemas
import { IKitchenRequirement, KitchenRequirementSchema } from "./kitchenRequirement.model"
import { IWardrobeRequirement, WardrobeRequirementSchema } from "./wardrobe.model"
import { BedroomRequirementSchema, IBedroomRequirement } from "./bedroom.model"
import { ILivingHallRequirement, LivingHallRequirementSchema } from "./livingroom.model"


interface IRequirementFormSchema extends Document {
  projectId: Types.ObjectId,
  filledBy: {
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
  shareTokenExpiredAt: Date | null
}

const RequirementFormSchema = new Schema<IRequirementFormSchema>(
  {
    // Track which project and client this is for
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectModel",
      required: true,
    },
    filledBy: {
      clientName: { type: String, required: true },
      email: { type: String, required: true },
      whatsapp: { type: String, required: true },
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
    },
    status: {
      type: String,
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
    }
  },
  { timestamps: true }
)

export const RequirementFormModel = mongoose.model<IRequirementFormSchema>("RequirementFormModel", RequirementFormSchema)
