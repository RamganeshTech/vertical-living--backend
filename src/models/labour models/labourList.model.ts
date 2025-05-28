import { Schema, model, Types } from "mongoose";


export interface ILabourList {
    projectId: Types.ObjectId,
    labourListName: string,
    labours: Types.ObjectId[]
}

const LaborListSchema = new Schema<ILabourList>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
        labourListName: { type: String, required: true },
        labours: [{ type: Schema.Types.ObjectId, ref: "LaborEstimateModel" }]
    },
    { timestamps: true }
);

export const LaborListModel = model("LaborListModel", LaborListSchema);
