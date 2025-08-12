import mongoose from "mongoose";
import { Schema, Types, Document } from "mongoose";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";




export interface IProjectDeliveryUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt: Date
}

export interface IProjectDelivery extends Document {
    projectId: Types.ObjectId;

    assignedTo: Types.ObjectId | null; // Staff ID reference (populated as needed)

    status: "pending" | "completed";

    isEditable: boolean;

    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadLine: Date | null;
        reminderSent: boolean;
    };

    uploads: IProjectDeliveryUpload[];


    // Double confirmation from both sides
    clientConfirmation: boolean;
    ownerConfirmation: boolean;
    clientAcceptedAt: Date | null;

}


const uploadSchema = new Schema<IProjectDeliveryUpload>({
    type: { type: String, enum: ["image", "pdf"], required: true },
    url: { type: String, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });



const ProjectDeleiverySchema = new Schema<IProjectDelivery>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "StaffModel",
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
        timer: {
            startedAt: { type: Date, default: null },
            completedAt: { type: Date, default: null },
            deadLine: { type: Date, default: null },
            reminderSent: { type: Boolean, default: false },
        },
        uploads: {
            type: [uploadSchema], 
            default: [],
        },
        clientConfirmation: {
            type: Boolean,
            default: false,
        },
        ownerConfirmation: {
            type: Boolean,
            default: false,
        },
        clientAcceptedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }

)

ProjectDeleiverySchema.index({projectId:1})
ProjectDeleiverySchema.plugin(procurementLogger)


export const ProjectDeliveryModel = mongoose.model(
    "ProjectDeliveryModel",
    ProjectDeleiverySchema
);