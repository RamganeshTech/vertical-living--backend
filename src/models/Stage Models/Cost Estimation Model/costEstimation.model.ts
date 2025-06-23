import { Schema, model, Types, Document } from "mongoose";

export interface ICostEstimation extends Document {
    projectId: Types.ObjectId;
    roomEstimations: {
        roomName: string;
        roomTotalCost: number, // 🆕 total for this room
        materials: {
            workName: string; // from modularWorks
            materialName: string; // from modularWorks.materials[]
            totalSqft: number; // from SiteMeasurementModel
            predefinedRatePerSqft: number;
            finalRatePerSqft: number;
            totalCost: number;
            isManualOverride: boolean;
            notes: string | null;
        }[];
    }[];
    totalEstimation:number
}

const CostEstimationSchema = new Schema<ICostEstimation>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
            required: true,
            index:true
        },
        roomEstimations: [
            {
                roomName: { type: String, required: true },
                totalCost: { type: Number, default:null },
                materials: [
                    {
                        workName: { type: String, required: true },
                        materialName: { type: String, required: true },
                        totalSqft: { type: Number, required: true }, // from site measurement
                        predefinedRatePerSqft: { type: Number, required: true },
                        finalRatePerSqft: { type: Number, required: true },
                        totalCost: { type: Number, required: true },
                        isManualOverride: { type: Boolean, default: false },
                        notes: { type: String, default: null },
                    },
                ],
            },
        ],
        totalEstimation: {type:Number, default:null}
    },
    { timestamps: true }
);

export const CostEstimationModel = model<ICostEstimation>("CostEstimationModel", CostEstimationSchema);
