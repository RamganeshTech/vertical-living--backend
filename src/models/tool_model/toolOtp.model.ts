import mongoose from "mongoose";

const ToolOtpLogSchema = new mongoose.Schema(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationModel" },

        generatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "generatedUserModel", default: null },
        generatedUserModel: { type: String, default: null },

        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel" },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkerModel" },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolIssueTransactionModel", default: null },

        transactionType: {
            type: String,
            // enum: ["Issue", "Return"]
        },
        toolRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolRoomModel", default: null },

        otp: { type: String, },

        otpGeneratedAt: Date,
        otpVerifiedAt: Date,
        expiresAt: { type: Date },

        metadata: {  // used when returning the things
            returnCondition: { type: String },
            damageNotes: { type: String }
        },

        isValid: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const ToolOtpModel = mongoose.model("ToolOtpModel", ToolOtpLogSchema);

export default ToolOtpModel;
