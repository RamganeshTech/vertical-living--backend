





import mongoose from "mongoose"

// Import individual sub-schemas
import { KitchenRequirementSchema } from "./kitchenRequirement.model" 
import { WardrobeRequirementSchema } from "./wardrobe.model" 
import { BedroomRequirementSchema } from "./bedroom.model" 
import { LivingHallRequirementSchema } from "./livingroom.model" 

const RequirementFormSchema = new mongoose.Schema(
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
      whatsapp: { type: String , required:true},
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
  },
  { timestamps: true }
)

export const RequirementFormModel = mongoose.model("RequirementFormModel", RequirementFormSchema)
