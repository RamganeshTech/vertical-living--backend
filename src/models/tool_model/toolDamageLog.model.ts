import mongoose from "mongoose";

const ToolDamageLogSchema = new mongoose.Schema(
    {
        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel" },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolIssueTransactionModel" },

        // reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        reportedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "reportedByModel" },
        reportedByModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },

        damageDescription: String,
        repairCost: Number
    },
    { timestamps: true }
);

const ToolDamageLogModel = mongoose.model("ToolDamageLogModel", ToolDamageLogSchema);

export default ToolDamageLogModel;
