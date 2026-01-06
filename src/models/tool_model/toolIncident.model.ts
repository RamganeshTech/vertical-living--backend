import mongoose from "mongoose";

const ToolIncidentSchema = new mongoose.Schema(
    {
        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel" },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolIssueTransactionModel" },

        incidentType: {
            type: String,
            // enum: ["Missing", "Theft", "Dispute"]
        },

        description: String,

        // escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


        escalatedTo: { type: mongoose.Schema.Types.ObjectId, refPath: "escalatedToModel" },
        escalatedToModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },

        status: {
            type: String,
            // enum: ["Open", "Closed", "Recovered"],
            default: "Open"
        }
    },
    { timestamps: true }
);

const ToolIncidentModel = mongoose.model("ToolIncidentModel", ToolIncidentSchema);

export default ToolIncidentModel
