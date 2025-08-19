import mongoose,{ Schema } from "mongoose";


const hrEmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed']
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  employment: {
    joinDate: Date,
    designation: String,
    department: String,
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel'
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern']
    },
    salary: {
      basic: Number,
      hra: Number,
      allowances: Number,
      total: Number
    },
    workLocation: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'aadhar', 'pan', 'passport', 'education', 'experience']
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_leave'],
    default: 'active'
  }
}, {
  timestamps: true
});

const hrLeaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HREmployee',
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
    ref: 'User'
  },
  approvalNotes: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
});
