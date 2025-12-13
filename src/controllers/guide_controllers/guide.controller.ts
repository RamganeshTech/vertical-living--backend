import { Request, Response } from "express";
import redisClient from "../../config/redisClient";
import { GuideLineModel } from "../../models/guide_model/guide.model";
import UserModel from "../../models/usermodel/user.model";
import CTOModel from "../../models/CTO model/CTO.model";
import { WorkerModel } from "../../models/worker model/worker.model";
import ClientModel from "../../models/client model/client.model";
import StaffModel from "../../models/staff model/staff.model";
import { RoleBasedRequest } from "../../types/types";


// Helper to generate cache keys
const getCacheKey = (orgId: string, stageName: string) => `tips:${orgId}:${stageName}`;

// ✅ GET Tips for a Specific Stage
export const getTipsForStage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, stageName } = req.params; // or req.query/req.body depending on your routes

        if (!organizationId || !stageName) {
            return res.status(400).json({ ok: false, message: "Organization ID and Stage Name are required" });
        }

        // 1. Check Redis Cache
        const cacheKey = getCacheKey(organizationId, stageName);
        const cachedData = await redisClient.get(cacheKey);
        await redisClient.del(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                ok: true,
                source: "cache",
                data: JSON.parse(cachedData),
            });
        }

        // 2. Fetch from DB
        // We use projection (select) to return only the specific stage to save bandwidth
        const guideDoc = await GuideLineModel.findOne(
            {
                organizationId,
                "stages.stageName": stageName
            },
            { "stages.$": 1 } // Return only the matched stage from the array
        );


        // ✅ FIX: Construct the correct object structure
        let responseData: any = {
            guidelines: []
        };

        if (guideDoc && guideDoc.stages.length > 0) {
            responseData = {
                guidelines: guideDoc.stages[0].guidelines // This is the array
            };
        }


        // let tips = [];
        // if (guideDoc && guideDoc.stages.length > 0) {
        //     tips = guideDoc.stages[0].guidelines;
        // }

        // 3. Set Redis Cache (Expire in 1 hour or your preference)
        // Storing just the array of tips for this specific stage
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 60 * 10 });

        return res.status(200).json({
            ok: true,
            source: "database",
            data: responseData,
        });

    } catch (error) {
        console.error("Error getting tips:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error", error });
    }
};

// ✅ UPSERT Tip (Create New or Update Existing)
// If you send 'tipId' in body -> It Updates. If 'tipId' is missing -> It Creates new.
export const upsertStageTip = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, stageName, tipText, tipId } = req.body;

        if (!organizationId || !stageName || !tipText) {
            return res.status(400).json({ ok: false, message: "Org ID, Stage Name, and Tip Text are required" });
        }

        // 1. Find the Organization Document
        let guideDoc = await GuideLineModel.findOne({ organizationId });

        // If Organization doesn't exist yet, create it
        if (!guideDoc) {
            guideDoc = new GuideLineModel({
                organizationId,
                stages: []
            });
        }

        // 2. Find the specific Stage within the document
        let stageIndex = guideDoc.stages.findIndex((s) => s.stageName === stageName);

        // If Stage doesn't exist yet, create it
        if (stageIndex === -1) {
            guideDoc.stages.push({
                stageName: stageName,
                guidelines: []
            });
            stageIndex = guideDoc.stages.length - 1; // Update index to the new one
        }

        // 3. Handle Add vs Update
        if (tipId) {
            // --- UPDATE EXISTING TIP ---
            const tipToUpdate = guideDoc.stages[stageIndex].guidelines.id(tipId);

            if (!tipToUpdate) {
                return res.status(404).json({ ok: false, message: "Tip ID not found in this stage" });
            }

            // Update the text
            tipToUpdate.tips = tipText;

        } else {
            // --- CREATE NEW TIP ---
            // @ts-ignore - Mongoose subdocument typing can be tricky, purely implies pushing object
            guideDoc.stages[stageIndex].guidelines.push({
                tips: tipText
            });
        }

        // 4. Save the Document
        await guideDoc.save();

        // 5. Clear Cache for this specific stage
        const cacheKey = getCacheKey(organizationId, stageName);
        await redisClient.del(cacheKey);

        return res.status(200).json({
            ok: true,
            message: tipId ? "Tip updated successfully" : "Tip added successfully",
            data: guideDoc.stages[stageIndex].guidelines // Return updated list
        });

    } catch (error) {
        console.error("Error upserting tip:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error", error });
    }
};

// ✅ DELETE Tip
export const deleteStageTip = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, stageName, tipId } = req.body; // Assuming sending ID in body, can be params too

        if (!organizationId || !stageName || !tipId) {
            return res.status(400).json({ ok: false, message: "Org ID, Stage Name, and Tip ID are required" });
        }

        // 1. Perform Delete using MongoDB $pull (Atomic operation is safer/faster for deletes)
        const result = await GuideLineModel.updateOne(
            {
                organizationId,
                "stages.stageName": stageName
            },
            {
                $pull: {
                    // Match the stage ($) and pull from guidelines where _id matches tipId
                    "stages.$.guidelines": { _id: tipId }
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ ok: false, message: "Tip not found or could not be deleted" });
        }

        // 2. Clear Cache
        const cacheKey = getCacheKey(organizationId, stageName);
        await redisClient.del(cacheKey);

        return res.status(200).json({
            ok: true,
            message: "Tip deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting tip:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error", error });
    }
};


// ✅ TOGGLE USER GUIDE PREFERENCE (Multi-Model Support)
export const toggleUserGuidePreference = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        // We get userId and role from the authenticated request (middleware)
        // OR you can pass them in body if you prefer, but req.user is safer.
        const userId = req.user?._id;
        const role = req.user?.role;
        const { organizationId } = req.params
        const { isGuideRequired } = req.body;

        if (!userId || !role) {
            return res.status(401).json({ ok: false, message: "Unauthorized: User details missing" });
        }

        if (typeof isGuideRequired !== 'boolean') {
            return res.status(400).json({ ok: false, message: "isGuideRequired must be a boolean" });
        }

        // Select Model based on Role
        let Model: any;

        switch (role.toLowerCase()) {
            case "owner":
                Model = UserModel;
                break;
            case "cto":
                Model = CTOModel;
                break;
            case "worker":
                Model = WorkerModel;
                break;
            case "client":
                Model = ClientModel;
                break;
            case "staff":
                Model = StaffModel;
                break;
            default:
                return res.status(400).json({ ok: false, message: "Invalid role specified" });
        }


        console.log('isGuideReqired', isGuideRequired)

        // Update the user document
        const updatedUser = await Model.findByIdAndUpdate(
            userId,
            { isGuideRequired: isGuideRequired },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        await redisClient.del(`getusers:${role}:${organizationId}`)
        const authCacheKey = `userAuth:${userId}`;

        await redisClient.del(authCacheKey);



        return res.status(200).json({
            ok: true,
            message: "User preference updated",
            data: { isGuideRequired: updatedUser.isGuideRequired }
        });

    } catch (error) {
        console.error("Error toggling guide preference:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};