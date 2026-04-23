import mongoose, { Schema, Document } from "mongoose";

// Unified Interface for Videos and Images
export interface IFileItem {
    _id?: mongoose.Types.ObjectId;
    type: string | null;
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

// Interface for the Main Configuration Model
export interface IProjectConfiguration extends Document {
    organizationId: mongoose.Types.ObjectId;
    videos: IFileItem[];
    images: IFileItem[];
    termsAndCondition: string | null;
}

// Reusable File Schema (Mongoose assigns an _id to objects in this array)
const FileSchema = new Schema({
    type: { type: String, default: null },
    url: { type: String, required: true },
    originalName: { type: String, default: null },
    uploadedAt: { type: Date, default: Date.now }
});

// Main Schema
const ProjectConfigurationSchema: Schema<IProjectConfiguration> = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "OrganizationModel", 
        required: true,
        unique: true
    },
    videos: {
        type: [FileSchema],
        default: []
    },
    images: {
        type: [FileSchema],
        default: []
    },
    termsAndCondition: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
});

export const ProjectConfigurationModel = mongoose.model<IProjectConfiguration>("ProjectConfigurationModel", ProjectConfigurationSchema);