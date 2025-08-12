// import mongoose, { Schema, Types } from "mongoose"

// // Import individual sub-schemas
// import { IKitchenRequirement, KitchenRequirementSchema } from "./kitchenRequirement.model"
// import { IWardrobeRequirement, WardrobeRequirementSchema } from "./wardrobe.model"
// import { BedroomRequirementSchema, IBedroomRequirement } from "./bedroom.model"
// import { ILivingHallRequirement, LivingHallRequirementSchema } from "./livingroom.model"
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin"


// export interface Iupload {
//     type?:"image" |" pdf",
//       url: string,
//       uploadedAt: Date,
//       originalName: string,
//     }

// interface IRequirementFormSchema extends Document {
//   projectId: Types.ObjectId,
//   assignedTo: Types.ObjectId,
//   clientData: {
//     clientName: string,
//     email: string,
//     whatsapp: string,
//     location: string
//   },
//   isEditable: boolean,
//   kitchen: IKitchenRequirement,
//   livingHall: ILivingHallRequirement,
//   bedroom: IBedroomRequirement,
//   wardrobe: IWardrobeRequirement,
//   additionalNotes: string | null,
//   status: "locked" | "pending" | "completed",
//   clientConfirmed: boolean,
//   shareToken: string,
//   shareTokenExpiredAt: Date | null,
//   timer: {
//     startedAt: Date | null,
//     completedAt: Date | null,
//     deadLine: Date | null,
//     reminderSent: boolean
//   },
//   uploads: Iupload[]
  
// }



// export const uploadSchema = new Schema({
//   type: { type: String, enum: ["image", "pdf"] },
//   url: { type: String,  },
//   originalName: String,
//   uploadedAt: { type: Date, default: new Date() }
// }, {_id: true});

// const RequirementFormSchema = new Schema<IRequirementFormSchema>(
//   {
//     // Track which project and client this is for
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ProjectModel",
//       required: true,
//     },
//     clientData: {
//       clientName: { type: String },
//       email: { type: String },
//       whatsapp: { type: String },
//       location: { type: String },
//     },
//     isEditable: {
//       type: Boolean,
//       default: true, // CTO, Owner, or Staff can lock it later
//     },
//     // Section-wise embedded forms
//     kitchen: {
//       type: KitchenRequirementSchema,
//       required: false,
//     },
//     wardrobe: {
//       type: WardrobeRequirementSchema,
//       required: false,
//     },
//     bedroom: {
//       type: BedroomRequirementSchema,
//       required: false,
//     },
//     livingHall: {
//       type: LivingHallRequirementSchema,
//       required: false,
//     },
//     additionalNotes: {
//       type: String,
//       default: null
//     },
//     status: {
//       type: String,
//       default: "pending"
//     },
//      assignedTo:{
//       type: Schema.Types.ObjectId,
//       default: null,
//       ref:"StaffModel"
//     },
//     shareToken: {
//       type: String,
//       // unique: true,
//     },
//     shareTokenExpiredAt: {
//       type: Date,
//       default: null, // Set only if needed
//     },
//     clientConfirmed: {
//       type: Boolean,
//       default: false
//     },
//     timer:{
//       startedAt: {type : Date, default: null},
//       completedAt: {type: Date, default: null},
//       deadLine: {type: Date, default: null},
//       reminderSent: {type: Boolean, default: false},
//     },
//     uploads: {type: [uploadSchema], default:[]}
//   },
//   { timestamps: true }
// )


// RequirementFormSchema.index({projectId: 1})

// RequirementFormSchema.plugin(procurementLogger)

// export const RequirementFormModel = mongoose.model<IRequirementFormSchema>("RequirementFormModel", RequirementFormSchema)
