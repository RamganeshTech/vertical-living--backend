import mongoose, { model, Schema, Types } from 'mongoose';




export interface Iupload {
    type: "image" | "pdf",
    url: string,
    uploadedAt: Date,
    originalName: string,
    categoryName: string,
}


export interface ISiteMeasurement extends Document {
    projectId: Types.ObjectId;
    status: "pending" | "completed";
    isEditable: boolean;

    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadLine: Date | null;
        reminderSent: boolean

    };
    assignedTo: Types.ObjectId;

    uploads: Iupload[];

    siteDetails: {
        totalPlotAreaSqFt: number | null;
        builtUpAreaSqFt: number | null;
        roadFacing: boolean | null;
        numberOfFloors: number | null;
        hasSlope?: boolean | null;
        boundaryWallExists?: boolean | null;
        additionalNotes?: string | null;
    };

    rooms: {
        name: string | null; // e.g. Kitchen, Bedroom1, Hall
        length: number | null;
        breadth: number | null;
        height?: number | null;
        uploads: Iupload[]
    }[];

}




const uploadSchema = new Schema({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    categoryName: {type:String, default:null},
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


const SiteMeasurementSchema = new Schema<ISiteMeasurement>({
    projectId: { type: Schema.Types.ObjectId, required: true, ref: "ProjectModel" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },

    timer: {
        startedAt: { type: Date, default: new Date() },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },

    },

    uploads: { type: [uploadSchema], default: [] },


    siteDetails: {
        totalPlotAreaSqFt: { type: Number, default: null },
        builtUpAreaSqFt: { type: Number, default: null },
        roadFacing: { type: Boolean, default: null },
        numberOfFloors: { type: Number, default: null },
        hasSlope: { type: Boolean, default: null },
        boundaryWallExists: { type: Boolean, default: null },
        additionalNotes: { type: String, default: null }
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "StaffModel"
    },

    rooms: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            name: { type: String, default: null },
            length: { type: Number, default: null },
            breadth: { type: Number, default: null },
            height: { type: Number, default: null },
                uploads: { type: [uploadSchema], default: [] },
        }
    ],


}, {
    timestamps: true
});


SiteMeasurementSchema.index({ projectId: 1 })


export const SiteMeasurementModel = model<ISiteMeasurement>("SiteMeasurementModel", SiteMeasurementSchema)

