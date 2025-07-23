// models/StageDocumentationModel.ts

import { model, Schema, Types } from "mongoose";

interface IStageUpload {
    type: "image" | "pdf";
    url: string;
    originalName: string;
}


interface IStageSchema {
    stageKey: string,
    stageNumber: string,
    description: string,
    uploadedFiles: IStageUpload[],
    price?:number | null
    pdfLink?:string
}



interface IStageDocumentation {
    projectId: Types.ObjectId,
    stages: IStageSchema[]
}


const uploadedFileSchema = new Schema<IStageUpload>({
    type: { type: String, enum: ["pdf", "image"] },
    url: { type: String },
    originalName: { type: String },
}, { _id: true })


const stageSchema = new Schema<IStageSchema>({
    stageKey: { type: String, }, // e.g. REQUIREMENT_FORM, SITE_MEASUREMENT
    stageNumber: { type: String },
    description: { type: String, }, // what was done
    uploadedFiles: [uploadedFileSchema],
    price:{type:Number, default:null},
    pdfLink: {type:String, default:null}
}, { _id: true })

const StageDocumentationSchema = new Schema<IStageDocumentation>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
    stages: { type: [stageSchema], default: [] }
}, {
    timestamps: true
});

export const StageDocumentationModel = model("StageDocumentationModdel", StageDocumentationSchema);
