import mongoose, { Schema, Types } from "mongoose";


export interface IConsultationAttachment {
    _id?: Types.ObjectId;
    type: "image" | "pdf";
    url: string;
    originalName?: string;
}


export interface IConsultationMessage {
    _id?: Types.ObjectId;
    sender: Types.ObjectId; // User ID
    senderModel: string,
    senderRole: "owner" | "staff" | "CTO" | "worker";
    message: string;
    section?: string; // Optional tag like "Kitchen"
    attachments?: IConsultationAttachment[];
    createdAt: Date;
    isEdited:boolean,
}

export interface IConsultationTimer {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
}

export interface ITechnicalConsultation {
    _id?: Types.ObjectId;
    projectId: Types.ObjectId;
    messages: IConsultationMessage[];
    timer: IConsultationTimer;
    status: "pending" | "completed";
    isEditable: boolean;
      assignedTo: Types.ObjectId;
}


const attachmentSchema = new Schema<IConsultationAttachment>({
    type: { type: String, enum: ["image", "pdf"], required: true },
    url: { type: String, required: true },
    originalName: { type: String },
}, { _id: true });

const messageSchema = new Schema<IConsultationMessage>({
    sender: { type: Schema.Types.ObjectId, required: true, refPath:"senderModel" },
    senderModel: {
        type: String,
        required: true,
        enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
    },
    senderRole: { type: String, enum: ["owner", "staff", "CTO", "worker"], required: true },
    message: { type: String },
    section: { type: String, required: false }, // e.g., "Kitchen"
    attachments: [attachmentSchema],
    createdAt: { type: Date, default: new Date() },
    isEdited: {type:Boolean, default:false}
}, { _id: true });

const technicalConsultationSchema = new Schema<ITechnicalConsultation>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    messages: [messageSchema],
    timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },

    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },
      assignedTo:{
          type: Schema.Types.ObjectId,
          default: null,
          ref:"StaffModel"
        },
    isEditable: { type: Boolean, default: true }
}, { timestamps: true });


technicalConsultationSchema.index({projectId:1})


export const TechnicalConsultationModel = mongoose.model("TechnicalConsultationModel", technicalConsultationSchema);
