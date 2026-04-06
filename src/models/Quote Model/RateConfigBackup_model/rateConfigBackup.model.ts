import mongoose, { Schema, Document } from "mongoose";

export interface RateConfigBackupDoc extends Document {
    organizationId: mongoose.Types.ObjectId;

    // What are we backing up? "CATEGORY_BUNDLE" or "SINGLE_ITEM"
    backupType: "CATEGORY_BUNDLE" | "SINGLE_ITEM";

    // Name to show in the UI Recycle Bin (e.g., "Plywood - Sharon Gold")
    displayName: string;

    // The original ID of the Category or Item (Critical for preventing duplicates)
    originalId: mongoose.Types.ObjectId;

    // The "JSON Blob" containing everything needed to rebuild the data
    snapshotData: {
        category?: any;      // The MaterialCategoryDoc data
        items?: any[];       // Array of all MaterialItemDoc data belonging to it
        singleItem?: any;    // Used if only a single item was deleted
    };

    itemCount: number;     // Helps the UI show "Restore 45 items"
    deletedBy: mongoose.Types.ObjectId;
    deletedUserModel:string,
    expiresAt: Date;       // TTL Index for auto-cleanup
}

const RateConfigBackupSchema = new Schema<RateConfigBackupDoc>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel",
            required: true,
            index: true
        },
        backupType: {
            type: String,
            enum: ["CATEGORY_BUNDLE", "SINGLE_ITEM"],
            required: true
        },
        displayName: { type: String, required: true },
        originalId: { type: Schema.Types.ObjectId, required: true },

        // The Mixed type allows us to store the complex nested JSON of Category + Items
        snapshotData: { type: Schema.Types.Mixed, required: true },

        itemCount: { type: Number, default: 1 },
        deletedBy: { type: Schema.Types.ObjectId, refPath: "deletedUserModel" },
        deletedUserModel: {
            type: String,
            required: true,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"], // your actual Mongoose model names
        },

        // Industry Standard: Auto-delete the backup from DB after 360 days
        // MongoDB background process will remove expired docs automatically
        expiresAt: {
            type: Date,
            required: true,
            expires: 0
        },
    },
    { timestamps: true }
);

export const RateConfigBackupModel = mongoose.model<RateConfigBackupDoc>(
    "RateConfigBackupModel",
    RateConfigBackupSchema
);