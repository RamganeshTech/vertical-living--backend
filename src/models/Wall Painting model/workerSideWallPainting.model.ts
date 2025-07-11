import mongoose, { Schema, model, Document, Types } from "mongoose";

// ---------------- Interfaces ----------------

export interface IUpload {
  type: "image" | "pdf";
  url: string;
  originalName: string;
  uploadedAt: Date;
}

export interface ICorrectionRound {
  roundNumber: number;
  adminNote: string;
  adminUploads: IUpload[];
  workerCorrectedUploads: IUpload[];
}

export interface IWorkerStep {
  stepNumber: number;
  initialUploads: IUpload[];
  correctionRounds: ICorrectionRound[];
}

export interface IWorkerSOP extends Document {
  projectId: Types.ObjectId;
  steps: IWorkerStep[];
  createdAt?: Date;
  updatedAt?: Date;
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

const CorrectionRoundSchema = new Schema<ICorrectionRound>(
  {
    roundNumber: Number,
    adminNote: String,
    adminUploads: [UploadSchema],
    workerCorrectedUploads: [UploadSchema],
  },
  { _id: true }
);

const WorkerStepSchema = new Schema<IWorkerStep>(
  {
    stepNumber: Number,
    initialUploads: [UploadSchema],
    correctionRounds: [CorrectionRoundSchema],
  },
  { _id: true }
);

const WorkerSOPSchema = new Schema<IWorkerSOP>(
  {
    projectId: {type: Schema.Types.ObjectId, ref:"ProjectModel", },
    steps: [WorkerStepSchema],
  },
  { timestamps: true }
);

export const WorkerWallPaintingModel =  model<IWorkerSOP>("WorkerSOPModel", WorkerSOPSchema);
