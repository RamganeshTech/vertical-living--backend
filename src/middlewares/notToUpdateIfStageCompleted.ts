import { Request, Response, NextFunction } from "express";
import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from "redis";
import redisClient from "../config/redisClient";

/**
 * Generic middleware to check if the previous stage is completed.
 * @param currentStage - The Mongoose model for the previous stage.
 */

export const notToUpdateIfStageCompleted = (currentStage: any): any => {
    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required.", ok: false, });
        }

        // console.log(currentStage.modelName)
        const redisKey = `stage:${currentStage.modelName}:${projectId}`
            // await redisClient.del(redisKey)



        if (currentStage.modelName !== "CostEstimation" && currentStage.modelName !== "PaymentConfirmationModel" && currentStage.modelName !== "SelectedModularUnitModel") {
            // Try Redis first
            // console.log("gettin d")
            let cachedData = await redisClient.get(redisKey);

            // console.log("gettin d", cachedData)

            if (cachedData) {

                const parsed = JSON.parse(cachedData);

                // console.log(JSON.parse(cachedData))
                if (parsed?.status !== "completed") {
                    return next();
                }
                if (parsed?.status === "completed") {
                    return res.status(400).json({
                        ok: false,
                        message: "Cannot update: The Current stage is already completed. Please reset the stage to make changes.",
                    });
                }
            }
        }

        // If not cached, check DB
        const doc = await currentStage.findOne({ projectId });

        if (doc && doc?.status === "completed") {

            if (currentStage.modelName !== "CostEstimation" && currentStage.modelName !== "PaymentConfirmationModel" && currentStage.modelName !== "SelectedModularUnitModel") {
                await redisClient.set(redisKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 });
            }

            if (currentStage.modelName === "SelectedModularUnitModel") {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Cannot update: Already Generated Bill. Please go to previous stage and reset it.",
                });
            }
            return res.status(400).json({
                ok: false,
                message:
                    "Cannot update: The Current stage is already completed. Please reset the stage to make changes.",
            });
        }

        if (currentStage.modelName !== "CostEstimation" && currentStage.modelName !== "PaymentConfirmationModel" && currentStage.modelName !== "SelectedModularUnitModel") {
            await redisClient.set(redisKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 });
        }
        next();

    };
};
