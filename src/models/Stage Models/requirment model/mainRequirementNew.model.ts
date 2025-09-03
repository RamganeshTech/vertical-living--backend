import mongoose, { Schema, Types } from "mongoose";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";

export interface Iupload {
    type?: "image" | "pdf"  | "video",
    url: string,
    uploadedAt: Date,
    originalName: string,
}


export interface IMainRequirementFormSchema extends Document {
    projectId: Types.ObjectId,
    assignedTo: Types.ObjectId,
    clientData: {
        clientName: string,
        email: string,
        whatsapp: string,
        location: string
    },
    status: "locked" | "pending" | "completed",
    isEditable: boolean,
    clientConfirmed: boolean,
    shareToken: string,
    shareTokenExpiredAt: Date | null,
    rooms: RequirementRooms[]
    timer: {
        startedAt: Date | null,
        completedAt: Date | null,
        deadLine: Date | null,
        reminderSent: boolean
    },
    uploads: Iupload[]
}

export interface Items {
    itemName: string,
    quantity: number,
    unit?: string
}

export interface RequirementRooms {
    roomName: string,
    items: Items[],
    uploads: Iupload[]

}

export const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf", "video"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });

export const ItemSchema = new Schema<Items>({
    itemName: { type: String, default: null },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "nos" }
}, { _id: true });

const RequirementRoomsSchema = new Schema({
    roomName: { type: String },
    items: { type: [ItemSchema], default: [] },
    uploads: { type: [uploadSchema], default: [] },
}, { _id: true });

const mainRequirementSchema = new Schema<IMainRequirementFormSchema>({
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
    rooms: {
        type: [RequirementRoomsSchema],
        default: []
    },
    status: {
        type: String,
        default: "pending"
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "StaffModel"
    },
    shareToken: {
        type: String,
        // unique: true,
    },
    shareTokenExpiredAt: {
        type: Date,
        default: null, // Set only if needed
    },
    clientConfirmed: {
        type: Boolean,
        default: false
    },
    timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
    },
    uploads: { type: [uploadSchema], default: [] }
},
    { timestamps: true }
)




mainRequirementSchema.index({ projectId: 1 })

// mainRequirementSchema.plugin(procurementLogger)

export const RequirementFormModel = mongoose.model("RequirementFormModel", mainRequirementSchema)



