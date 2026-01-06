import mongoose, {Types} from "mongoose";



export type ReceivedByUserModelType =
  | "UserModel"
  | "StaffModel"
  | "CTOModel"
  | "WorkerModel";


export interface IToolReturnTransaction {
  _id?: Types.ObjectId;
  organizationId: Types.ObjectId;
  transactionId: Types.ObjectId; // ref: ToolIssueTransactionModel
  toolRoomId?: Types.ObjectId | null;
  toolId?: Types.ObjectId | null;
  returnDateTime?: Date;
  returnCondition?: string;
  // later you can restrict:
  // "ok" | "damaged"
  damageNotes?: string;
  returnOtpVerified: boolean;
  receivedByUserId?: Types.ObjectId;
  receivedByUserModel?: ReceivedByUserModelType;
  createdAt?: Date;
  updatedAt?: Date;
}


const ToolReturnTransactionSchema = new mongoose.Schema<IToolReturnTransaction>(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationModel" },
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ToolIssueTransactionModel",
            required: true,
        },
        toolRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolRoomModel", default: null },
        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel", default: null },
        returnDateTime: Date,

        returnCondition: {
            type: String,
            // enum: ["oK", "damaged"]
        },

        damageNotes: String,

        returnOtpVerified: { type: Boolean, default: false },

        //   receivedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
        receivedByUserId: { type: mongoose.Schema.Types.ObjectId, refPath: "receivedByUserModel" },
        receivedByUserModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel", null], // your actual Mongoose model names
        },

    },
    { timestamps: true }
);

const ToolReturnTransactionModel = mongoose.model("ToolReturnTransactionModel", ToolReturnTransactionSchema);
export default ToolReturnTransactionModel;
