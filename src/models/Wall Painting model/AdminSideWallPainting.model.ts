import mongoose, { Schema, model, Document, Types } from "mongoose";

// ---------------- Interfaces ----------------

export interface IUpload {
  type: "image" | "pdf";
  url: string;
  originalName: string;
  uploadedAt: Date;
}

export interface IAdminStep {
  stepNumber: number;
  workerInitialUploads: IUpload[];
  adminCorrectionNote?: string;
  adminCorrectionUploads: IUpload[];
  status: "pending" | "approved" | "rejected";
}

export interface IAdminSOP extends Document {
  projectId: Types.ObjectId;
  steps: IAdminStep[];
  status: "pending" | "approved";
}

// ---------------- Schemas ----------------

const UploadSchema = new Schema<IUpload>(
  {
    type: { type: String, enum: ["image", "pdf"] },
    url: String,
    originalName: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AdminStepSchema = new Schema<IAdminStep>(
  {
    stepNumber: Number,
    workerInitialUploads: [UploadSchema],
    adminCorrectionNote: String,
    adminCorrectionUploads: [UploadSchema],
    status: { type: String, enum: ["pending", "approved", "rejected"] },
  },
  { _id: true }
);

const AdminSOPSchema = new Schema<IAdminSOP>(
  {
    projectId: {type: Schema.Types.ObjectId, ref:"ProjectModel", },
    status: { type: String, enum: ["pending", "approved"] },
  },
  { timestamps: true }
);

export const AdminWallPaintingModel = model<IAdminSOP>("AdminSOPModel", AdminSOPSchema);
