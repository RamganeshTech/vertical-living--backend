import mongoose, { model, Schema, Types } from 'mongoose';
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

    uploads: {
        type: "image" | "pdf";
        url: string;
        originalName: string;
        uploadedAt: Date;
    }[];

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
    }[];

}


const SiteMeasurementSchema = new Schema<ISiteMeasurement>({
    projectId: { type: Schema.Types.ObjectId, required: true, ref: "ProjectModel" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },

    timer: {
        startedAt: { type: Date, default: new Date() },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
      reminderSent: {type: Boolean, default: false},

    },

    uploads: [
        {
            type: { type: String, enum: ["image", "pdf"], required: true },
            url: { type: String, required: true },
            originalName: String,
            uploadedAt: { type: Date, default: new Date() }
        }
    ],

    siteDetails: {
        totalPlotAreaSqFt: { type: Number, default: null },
        builtUpAreaSqFt: { type: Number, default: null },
        roadFacing: { type: Boolean, default: null },
        numberOfFloors: { type: Number, default: null },
        hasSlope: { type: Boolean, default: null },
        boundaryWallExists: { type: Boolean, default: null },
        additionalNotes: { type: String, default: null }
    },

    rooms: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            name: { type: String, default: null },
            length: { type: Number, default: null },
            breadth: { type: Number, default: null },
            height: { type: Number, default: null }
        }
    ],


}, {
    timestamps: true
});

export const SiteMeasurementModel = model<ISiteMeasurement>("SiteMeasurementModel", SiteMeasurementSchema)

