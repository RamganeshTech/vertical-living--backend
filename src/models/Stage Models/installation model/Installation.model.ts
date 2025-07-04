import mongoose, { model, Schema, Types } from 'mongoose'

export interface InstallationUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt: Date
}

interface InstallationItem {
    workName: string,
    descritpion: string,
    completedDate: Date,
    upload: InstallationUpload
}

interface IInstallationMain extends Document {
    projectId: Types.ObjectId;

    isEditable: boolean;
    assignedTo: Types.ObjectId;

    LivingRoom: InstallationItem[]
    Bedroom: InstallationItem[]
    Kitchen: InstallationItem[]
    DiningRoom: InstallationItem[]
    Balcony: InstallationItem[]
    FoyerArea: InstallationItem[]
    Terrace: InstallationItem[]
    StudyRoom: InstallationItem[]
    CarParking: InstallationItem[]
    Garden: InstallationItem[]
    StorageRoom: InstallationItem[]
    EntertainmentRoom: InstallationItem[]
    HomeGym: InstallationItem[]

    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadLine: Date | null;
        reminderSent: boolean;
    };

    status: "pending" | "completed";
}



export const uploadSchema = new Schema<InstallationUpload>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });


const installationWorkSchema = new Schema<InstallationItem>({
    workName: { type: String },
    descritpion: { type: String },
    completedDate: { type: Date },
    upload: uploadSchema
}, { _id: true })



const InstallationSchema = new Schema<IInstallationMain>({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectModel",
        required: true,
    },

    LivingRoom: { type: [installationWorkSchema], default: [] },
    Bedroom: { type: [installationWorkSchema], default: [] },
    Kitchen: { type: [installationWorkSchema], default: [] },
    DiningRoom: { type: [installationWorkSchema], default: [] },
    Balcony: { type: [installationWorkSchema], default: [] },
    FoyerArea: { type: [installationWorkSchema], default: [] },
    Terrace: { type: [installationWorkSchema], default: [] },
    StudyRoom: { type: [installationWorkSchema], default: [] },
    CarParking: { type: [installationWorkSchema], default: [] },
    Garden: { type: [installationWorkSchema], default: [] },
    StorageRoom: { type: [installationWorkSchema], default: [] },
    EntertainmentRoom: { type: [installationWorkSchema], default: [] },
    HomeGym: { type: [installationWorkSchema], default: [] },

    isEditable: { type: Boolean, default: true },

    timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "StaffModel"
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },
}, { timestamps: true })

InstallationSchema.index({projectId:1})


const InstallationModel = model("InstallationModel", InstallationSchema)

export default InstallationModel;