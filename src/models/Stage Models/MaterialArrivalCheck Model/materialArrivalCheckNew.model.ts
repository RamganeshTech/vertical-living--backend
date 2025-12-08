import mongoose, { model, Schema, Types } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";


export interface IMaterialArrivalTimer {
  startedAt: Date | null;
  completedAt: Date | null;
  deadLine: Date | null;
  reminderSent: boolean
}


export interface IUploadFile {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}


export interface MaterialArrivalSingle{
     image: IUploadFile | null,
    quantity: number,
    // customId: string,
    unitName: string,
    isVerified: boolean
}

export interface IMaterialArrival {
  projectId: Types.ObjectId;
  status: "pending" | "completed";
    assignedTo: Types.ObjectId;
  isEditable: boolean;
  materialArrivalList: {};
  timer: IMaterialArrivalTimer;
  generatedLink: string | null;
}


// Timer schema
const TimerSchema = new Schema<IMaterialArrivalTimer>({
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deadLine: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
}, { _id: false });



// Upload file schema
const UploadSchema = new Schema<IUploadFile>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String,  },
  originalName: { type: String },
  uploadedAt: { type: Date, default: new Date() },
}, { _id: false });


const MaterialSchema = new Schema<MaterialArrivalSingle>({
    image: {type: UploadSchema, default:null},
    quantity: {type: Number, default: 0},
    // customId: {type: String, default: null},
    unitName: {type: String, default: null},
    isVerified: {type: Boolean, default:false}
})


// Main schema
const MaterialArrivalSchema = new Schema<IMaterialArrival>({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  isEditable: { type: Boolean, default: true },

  materialArrivalList: {
   type: [MaterialSchema], default:[]
  },
    assignedTo:{
      type: Schema.Types.ObjectId,
      default: null,
      ref:"StaffModel"
    },
  timer: { type: TimerSchema, required: true },
  generatedLink: { type: String, default: null },
}, { timestamps: true });

MaterialArrivalSchema.index({projectId:1})

// MaterialArrivalSchema.plugin(procurementLogger);

const MaterialArrivalModel = model("MaterialArrivalModel", MaterialArrivalSchema)

export default MaterialArrivalModel;

