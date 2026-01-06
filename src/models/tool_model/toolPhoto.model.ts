import mongoose, { Schema } from "mongoose";

export interface IUploadPdf {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}


const toolUploadSchema = new Schema<IUploadPdf>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });



const ToolPhotoSchema = new mongoose.Schema(
    {
        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel", required: true },
        //   photoUrl: { type: String, required: true },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolIssueTransactionModel", default: null },
        photo: { type: toolUploadSchema },
        photoType: {
            type: String,
            enum: ["master", "damage", "repair"],
            default: "master"
        },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "uploaderModel" },
        uploaderModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },
    },
    { timestamps: true }
);

const ToolPhotoModel = mongoose.model("ToolPhotoModel", ToolPhotoSchema);
export default ToolPhotoModel;
