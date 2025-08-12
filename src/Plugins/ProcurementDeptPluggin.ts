import mongoose from "mongoose";
import procurementModel from "../models/Procurement Model/procurement.model";
import { Schema, Types } from "mongoose";
import ProjectModel from "../models/project model/project.model";

export interface ActiveLogEntry {
    projectId?: mongoose.Types.ObjectId | null;
    userId?: mongoose.Types.ObjectId | null;
    userType?: "UserModel" | "StaffModel" | "WorkerModel" | "ClientModel" | "CTOModel" | null;
    stageId?: mongoose.Types.ObjectId | null;
    stageModel?: string | null;
    userRole?: string | null;
    actionType: string;
    description?: string;
    newData?: Record<string, any>;

    // [key: string]: any;

}


// Shape for the Procurement document
interface ProcurementDoc extends Document {
    organizationId: mongoose.Types.ObjectId;
    activeLog: ActiveLogEntry[];
}

// Extend any mongoose doc to allow our temp user tracking fields
interface TrackedDoc extends Document {
    __userId?: mongoose.Types.ObjectId;
    __userType?: string;
    __userRole?: string;
    organizationId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    stageId?: mongoose.Types.ObjectId;
    stageModel?: string;
    [key: string]: any;
}

function toObjectId(id: any) {
    if (Types.ObjectId.isValid(id)) {
        return new Types.ObjectId(String(id)); // ensure string
    }
    return null;
}

async function resolveOrganizationId(doc: any): Promise<mongoose.Types.ObjectId | null> {
    // Direct organization on doc
    if (doc.organizationId) {
        return doc.organizationId;
    }

    // From projectId
    if (doc.projectId) {
        const project = await ProjectModel.findById(doc.projectId).select("organizationId").lean();
        return project?.organizationId ?? null;
    }

    // From stageId + stageModel
    if (doc.stageId && doc.stageModel) {
        try {
            interface StageDoc {
                projectId?: mongoose.Types.ObjectId;
            }

            const StageModel = mongoose.model<StageDoc>(doc.stageModel);
            const stage = await StageModel.findById(doc.stageId)
                .select("projectId")
                .lean<StageDoc | null>();

            if (stage?.projectId) {
                const project = await ProjectModel.findById(stage.projectId)
                    .select("organizationId")
                    .lean<{ organizationId?: mongoose.Types.ObjectId } | null>();
                return project?.organizationId ?? null;
            }
        } catch (err) {
            console.error(`Stage model '${doc.stageModel}' not found`, err);
        }
    }

    return null;
}


function procurementLogger(schema: Schema) {


    // Helper to call logChange with stage info
    async function logWithStage(actionType: string, doc: any, modelName: string) {
        await logChange(actionType, {
            ...doc,
            stageModel: modelName, // explicitly store which model
            stageId: doc._id || null
        });
    }

    // Hook for create
    schema.post("save", async function (doc) {
        try {
            const modelName = (this.constructor as mongoose.Model<Document>).modelName;
            await logWithStage("create", doc.toObject ? doc.toObject() : doc, modelName);
        } catch (err) {
            console.error("Procurement log save error:", err);
        }
    });

    // Hook for update
    schema.post(["findOneAndUpdate", "updateOne", "updateMany"], async function () {
        try {
            const updatedDoc = await this.model.findOne(this.getQuery()).lean();
            if (updatedDoc) {
                await logWithStage("update", updatedDoc, this.model.modelName);
            }
        } catch (err) {
            console.error("Procurement log update error:", err);
        }
    });

    // Hook for delete
    schema.post(["findOneAndDelete", "deleteOne", "deleteMany"], async function (res) {
        try {
            const deletedDoc = res?.value || res;
            if (deletedDoc) {
                await logWithStage("delete", deletedDoc, this.model.modelName);
            }
        } catch (err) {
            console.error("Procurement log delete error:", err);
        }
    });
}

// Helper: create procurement log entry
async function logChange(actionType: string, doc: any) {
    // Try to determine organizationId
    const organizationId = await resolveOrganizationId(doc);

    if (!organizationId) {
        console.warn("Could not resolve organizationId for log entry", doc._id);
        return;
    }

    // Get logged-in user (from doc if passed in, or leave null if system update)
    const userId = doc.__userId || null;
    const userType = doc.__userType || null;
    const userRole = doc.__userRole || null;

    const projectId = toObjectId(doc.projectId);
    // Create log
    await procurementModel.updateOne(
        { organizationId },
        {
            $push: {
                activeLog: {
                    projectId,
                    stageId: doc.stageId || doc._id || null,
                    stageModel: doc.stageModel || null,
                    userId,
                    userType,
                    userRole,
                    actionType,
                    description: `${actionType} performed on ${doc.stageModel}`,
                    newData: doc
                }
            }
        },
        { upsert: true }
    );
}

export default procurementLogger;
