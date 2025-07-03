import mongoose, { Schema, Document, Types } from "mongoose";



export interface ICleaningUpload {
    type: "image" | "pdf";
    url: string;
    originalName: string;
    uploadedAt: Date
}

export interface IRoomCleaning {
    // _id: mongoose.Types.ObjectId;
    roomName: string;
    uploads: ICleaningUpload[];
    completelyCleaned: boolean;
    notes: string;
}

export interface ICleaningAndSanitation extends Document {
    projectId: Types.ObjectId;
    rooms: IRoomCleaning[];
    status: "pending" | "completed";
    isEditable: boolean;
    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadline: Date | null;
        reminderSent: boolean
    };
          assignedTo: Types.ObjectId;

}



const uploadSchema = new Schema<ICleaningUpload>({
    type: { type: String, enum: ["image", "pdf"], required: true },
    url: { type: String, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });


const RoomCleaningSchema = new Schema<IRoomCleaning>(
    {
        roomName: { type: String, required: true },
        uploads: {type: [uploadSchema], default:[]},
        completelyCleaned: { type: Boolean, default: false },
        notes: { type: String, default:null },
    },
    { _id: true } 
);

const CleaningAndSanitationSchema = new Schema<ICleaningAndSanitation>(
    {
        projectId: { type: Schema.Types.ObjectId, required: true , ref:"ProjectModel"},
        rooms: [RoomCleaningSchema],
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
        },
        isEditable: { type: Boolean, default: true },
        timer: {
            startedAt: { type: Date, default: null },
            completedAt: { type: Date, default: null },
            deadLine: { type: Date, default: null },
            reminderSent: { type: Boolean, default: false },
        },
  assignedTo:{
      type: Schema.Types.ObjectId,
      default: null,
      ref:"StaffModel"
    },


    },
    { timestamps: true }
);

export const CleaningAndSanitationModel = mongoose.model<ICleaningAndSanitation>(
    "CleaningAndSanitationModel",
    CleaningAndSanitationSchema
);
