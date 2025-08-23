import mongoose, { model, Schema, Types } from "mongoose";



export interface IPersonalInfo {
  empName?: string;
  dateOfBirth?: Date;
  email:string,
  phoneNo:string,
  gender?: "male" | "female" | "other";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

export interface IEmployment {
  joinDate?: Date;
  designation?: string;
  department?: string;
  reportingTo?: Types.ObjectId;
  employmentType?: "full_time" | "part_time" | "contract" | "intern";
  salary?: {
    basic?: number;
    hra?: number;
    allowances?: number;
    total?: number;
  };
  // specificRole:string,
  workLocation?: string;
}

export interface IDocument {
  type?: "resume" | "aadhar" | "pan" | "passport" | "education" | "experience";
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: Date;
}

export interface IEmployee {
  // employeeId?: string;
  organizationId: Types.ObjectId,
  empId?: Types.ObjectId;
  employeeModel?: "UserModel" | "StaffModel" | "CTOModel" | "WorkerModel";
  empRole: "organization_staff" | "nonorganization_staff",
  personalInfo?: IPersonalInfo;
  employment?: IEmployment;
  documents?: IDocument[];
  status?: "active" | "inactive" | "terminated" | "on_leave";
}


export interface HREmployee extends Document {
  organizaitonId: Types.ObjectId,
  employeeDetails: Types.ObjectId[]
}


export const PersonalInfoSchema = new Schema<IPersonalInfo>({
  empName: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  email: {type:String, default:null},
  phoneNo: {type:String, default:null},
  gender: { type: String, enum: ["male", "female", "other", null], default: null },
  maritalStatus: { type: String, enum: ["unmarried", "married", "divorced", "widowed", null], default: null },
  address: {
    type: {
      street:  { type: String, default: null },
      city:  { type: String, default: null },
      state:  { type: String, default: null },
      pincode:  { type: String, default: null },
      country: { type: String, default: "India" },
    }, default: {}
  },
  emergencyContact: {
    type: {
      name:  { type: String, default: null },
      relationship:  { type: String, default: null },
      phone:  { type: String, default: null },
    }, default: {}
  }
}, { _id: false });


export const EmploymentSchema = new Schema<IEmployment>({
  joinDate: { type: Date, default: new Date() },
  designation: { type: String, default: null },
  department: { type: String, default: null },
  employmentType: { type: String, enum: ["full_time", "part_time", "contract", "intern", null], default: null },
  salary: {
    type: {
      basic:  { type: Number, default: null },
      hra: { type: Number, default: null },
      allowances: { type: Number, default: null },
      total: { type: Number, default: null },
    }, default: {}
  },
  // specificRole:{type:String, default:null},
  workLocation: { type: String, default: null },
}, { _id: false });



export const DocumentSchema = new Schema<IDocument>({
  type: {
    type: String,
    enum: ["resume", "aadhar", "pan", "passport", "education", "experience"]
  },
  fileName: String,
  fileUrl: String,
  uploadedAt: Date
}, { _id: true });

const EmployeeSchema = new Schema<IEmployee>({
  
  organizationId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrganizationModel",
  },
  empId: {               // going to take the empId from the client model, worker model, cto models _id propery value will be stored
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'employeeModel',
  },
  employeeModel: {
    type: String,
    enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"],
  },
  empRole: { type: String, default: null },
  personalInfo: { type: PersonalInfoSchema, default: {} },
  employment: { type: EmploymentSchema, default: {} },
  documents: { type: [DocumentSchema], default: [] },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_leave'],
    default: 'active'
  }
}, { timestamps: true })




const HRMainSchema = new Schema<HREmployee>({
  organizaitonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrganizationModel",
  },
  employeeDetails: { type: [Schema.Types.ObjectId], default: [] }
}, {
  timestamps: true
});

export const HREmployeeModel = mongoose.model("HRMainModel", HRMainSchema)

export const EmployeeModel = model("HREmployeeModel",EmployeeSchema )