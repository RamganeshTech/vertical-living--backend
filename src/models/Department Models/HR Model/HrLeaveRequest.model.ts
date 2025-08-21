import mongoose, { Schema } from "mongoose";
import { Types, Document } from "mongoose";

export interface ILeaveDetail {
  employeeId: Types.ObjectId; // reference to HREmployeeModel
  leaveType: "casual" | "sick" | "vacation" | "maternity" | "paternity" | "emergency";
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId; // polymorphic reference
  approvedByModel?: "UserModel" | "StaffModel" | "CTOModel" | "WorkerModel";
  approvalNotes?: string;
  appliedAt?: Date;
}

export interface IHRLeaveRequest extends Document {
  organizaitonId: Types.ObjectId; // Organization reference
  LeaveDetail: ILeaveDetail[];
}


const LeaveDetailSchema = new Schema<ILeaveDetail>({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HREmployeeModel',
    },
    leaveType: {
        type: String,
        enum: ['casual', 'sick', 'vacation', 'maternity', 'paternity', 'emergency'],
    },
    fromDate: {
        type: Date,
    },
    toDate: {
        type: Date,
    },
    totalDays: Number,
    reason: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'approvedByModel'
    },
    approvedByModel: {
        type: String,
        enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"],
    },
    approvalNotes: String,
    appliedAt: {
        type: Date,
        default: new Date()
    }
}, {_id:true})

const hrLeaveRequestSchema = new Schema<IHRLeaveRequest>({
    organizaitonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrganizationModel",
    },
    LeaveDetail: {type:[LeaveDetailSchema], default:[]}
}, { timestamps: true });


export const HRLeaveRequestModel = mongoose.model("HRLeaveRequestModel", hrLeaveRequestSchema)
