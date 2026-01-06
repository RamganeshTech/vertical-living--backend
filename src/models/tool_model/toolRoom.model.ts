import mongoose from "mongoose";

const ToolRoomSchema = new mongoose.Schema(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationModel" },

        toolRoomName: { type: String, required: true },
        location: String,
        //   inchargeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        inchargeUser: { type: mongoose.Schema.Types.ObjectId, refPath: "inchargeModel" },
        inchargeModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },

        allowedIssueFrom: { type: String },// default: "09:00"
        allowedIssueTo: { type: String }, //default: "18:00"

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const ToolRoomModel = mongoose.model("ToolRoomModel", ToolRoomSchema);

export default ToolRoomModel;
