import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IWorkReportUpload {
    _id?: Types.ObjectId;
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date
}

export interface IWorkReport extends Document {
    workerName: string;
    date: Date;
    placeOfWork: string;

    reportingTime?: string;
    workStartTime?: string;
    travelingTime?: string;

    workDone: string;
    finishingTime?: string;
    shiftDone?: string;
    placeOfStay?: string;

    images?: IWorkReportUpload[];
    organizationId?: string;
    projectId?: string;
    imageLink?: IWorkReportUpload;
}

const uploadSchema = new Schema<IWorkReportUpload>({
    type: { type: String, enum: ["image", "pdf"], },
    url: { type: String, },
    originalName: { type: String , default:null},
    uploadedAt: {type: Date, default:new Date()}
}, { _id: true });

const WorkReportSchema = new Schema<IWorkReport>(
  {
    workerName: { type: String,default:null  },
    date: { type: Date, default:null },
    placeOfWork: { type: String, default:null },

    reportingTime: { type: String, default: null },
    workStartTime: { type: String, default: null },
    travelingTime: { type: String, default: null },

    workDone: { type: String, default:null },
    finishingTime: { type: String, default: null },
    shiftDone: { type: String, default: null },
    placeOfStay: { type: String, default: null },

    images: { type: [uploadSchema], default: [] }, // keep empty array for consistency

    organizationId: { type: Schema.Types.ObjectId, ref: "OrganizationModel", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", default: null },
    imageLink: {type: uploadSchema, default:null}
  },
  { timestamps: true }
);


const WorkReportModel = mongoose.model<IWorkReport>("WorkReportModel", WorkReportSchema);
export default WorkReportModel