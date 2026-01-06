import mongoose , {Types} from "mongoose";

export type IssuedByUserModelType =
  | "UserModel"
  | "StaffModel"
  | "CTOModel"
  | "WorkerModel";

export interface IToolIssueTransaction {
  _id?: Types.ObjectId;

  organizationId: Types.ObjectId;

  toolId: Types.ObjectId;
  toolWorkerId: Types.ObjectId;
  projectId: Types.ObjectId;

  toolRoomId?: Types.ObjectId | null;
  toolReturnId?: Types.ObjectId | null;

  issueDateTime: Date;
  expectedReturnDate?: Date | null;

  issueOtpVerified: boolean;

  issuedByUserId?: Types.ObjectId;
  issuedByUserModel?: IssuedByUserModelType;

  transactionStatus: string; 
 
  createdAt?: Date;
  updatedAt?: Date;
}


const ToolIssueTransactionSchema = new mongoose.Schema<IToolIssueTransaction>(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationModel" },

        toolId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolMasterModel", required: true },
        toolWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkerModel", required: true },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true },
        toolRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolRoomModel", default:null },
        toolReturnId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolReturnTransactionModel", default:null },

        issueDateTime: { type: Date, required: true },
        expectedReturnDate: { type: Date, default: null },

        issueOtpVerified: { type: Boolean, default: false },

        // issuedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        issuedByUserId: { type: mongoose.Schema.Types.ObjectId, refPath: "issuedByUserModel" },
        issuedByUserModel: {
            type: String,
            // required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },

        transactionStatus: {
            type: String,
            // enum: ["Issued", "Returned", "Missing"],
            default: "issued"
        }
    },
    { timestamps: true }
);


const ToolIssueTransactionModel = mongoose.model("ToolIssueTransactionModel", ToolIssueTransactionSchema);

export default ToolIssueTransactionModel;
