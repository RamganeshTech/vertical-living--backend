// backend/models/Notification.model.ts

import mongoose, { Document, Schema } from 'mongoose';

// TypeScript Interface
export interface INotification extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userModel: string,
    message: string;
    type: 'info' | 'warning' | 'assignment';
    isRead: boolean;
    navigation: {
        url: string; // frontend route like "/projects/123/staff"
        label?: string; // optional button text like "Go to staff page"
    };
    projectId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose Schema
const NotificationSchema = new Schema<INotification>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
        },
        userId: {
            type: Schema.Types.ObjectId,
            refPath: 'userModel',
        },
        userModel: {
            type: String,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },
        message: {
            type: String,
            maxlength: 500,
        },
        type: {
            type: String,
            enum: ['info', 'warning', 'assignment'],
            default: 'info',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        navigation: {
            url: { type: String, }, // example: "/vertical-living/staff-tasks"
            label: { type: String, default: "Click here" },
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'ProjectModel',
            default: null,
        },
    },
    {
        timestamps: true, // Automatically creates createdAt and updatedAt
    }
);

// Export Model
export const Notification = mongoose.model<INotification>(
    'NotificationModel',
    NotificationSchema
);