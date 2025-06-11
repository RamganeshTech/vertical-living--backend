import { model, Schema, Types } from "mongoose";

export interface MaterialList {
    projectId: Types.ObjectId;
    materialListName: string;
    materials: Types.ObjectId[],
    // clientApproval:"approved" | "rejected" | "pending"
}


const MaterialListSchema = new Schema<MaterialList>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    materialListName: {
        type: String,
        required: true
    },
    materials: {
        type: [Schema.Types.ObjectId],
        ref: "MaterialEstimateModel",
        default: [], //this will be array of strings not in array of objects ["34fvg78", "34fvg78"]
    },
}, {
    timestamps:true
})

const MaterialListModel = model("MaterialListModel", MaterialListSchema)

export default MaterialListModel;