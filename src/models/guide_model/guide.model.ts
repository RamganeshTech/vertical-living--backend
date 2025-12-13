import mongoose, { Schema } from "mongoose";



const guideLines = new Schema({
    tips: { type: String, default: null }
}, { _id: true })

const ModuleTipsSchema = new Schema(
    {
        stageName: {
            type: String,  //"modularunit", "cleaning", // lets use the same permission name of the each module we have used to provide the permission
        },
        firstShown: { type: Boolean, default: false },

        guidelines: {
            type: [guideLines], default: []
        }
    },
    { _id: true }
);

const GuildSchema = new Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationModel",
        },

        stages: {
            type: [ModuleTipsSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export const GuideLineModel = mongoose.model(
    "GuideLineModel",
    GuildSchema
);
