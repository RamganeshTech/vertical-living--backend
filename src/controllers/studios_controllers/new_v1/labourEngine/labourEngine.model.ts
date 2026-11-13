// labourEngineSettings.model.ts
import mongoose, { Schema } from "mongoose";
import type { ILabourEngineSettings, LabourEngineChangeEntry } from "./labourEngine.types";

/** How many past versions of the settings are kept (each with the full settings). */
export const MAXIMUM_LABOUR_ENGINE_HISTORY = 50;

const LabourEngineChangeSchema = new Schema<LabourEngineChangeEntry>(
  {
    version: { type: Number, required: true, min: 1 },
    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
    changedByRole: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, maxlength: 500, default: "" },
    // config: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const LabourEngineSettingsSchema = new Schema<ILabourEngineSettings>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", required: true },
    version: { type: Number, min: 1, default: 1 },
    config: { type: Schema.Types.Mixed, required: true },
    history: { type: [LabourEngineChangeSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "UserModel", default: null },
  },
  { timestamps: true, minimize: false }
);

LabourEngineSettingsSchema.index({ organizationId: 1 }, { unique: true });

const LabourEngineSettingsModel = mongoose.model<ILabourEngineSettings>("LabourEngineSettingsModel", LabourEngineSettingsSchema);
export default LabourEngineSettingsModel;
