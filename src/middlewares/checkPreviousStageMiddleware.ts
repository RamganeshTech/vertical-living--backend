import { Request, Response, NextFunction } from "express";
import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from "redis";
import redisClient from "../config/redisClient";

/**
 * Generic middleware to check if the previous stage is completed.
 * @param previousStageModel - The Mongoose model for the previous stage.
 */

export const checkPreviousStageCompleted = (previousStageModel: any): any => {
    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required.", ok: false, });
        }

        // console.log(previousStageModel.modelName)
        const redisKey = `stage:${previousStageModel.modelName}:${projectId}`

        if (previousStageModel.modelName !== "CostEstimation" && previousStageModel.modelName !== "PaymentConfirmationModel") {
            // Try Redis first
            // console.log("gettin d")
            let cachedData = await redisClient.get(redisKey);

            // console.log("gettin d", cachedData)

            if (cachedData) {
                // console.log(JSON.parse(cachedData))
                if (JSON.parse(cachedData)?.status === "completed") {
                    return next()
                }
            }
        }

        // If not cached, check DB
        const doc = await previousStageModel.findOne({ projectId });

        if (!doc || doc?.status !== "completed") {
            return res.status(400).json({
                ok: false,
                message:
                    "Cannot proceed: The previous stage is not completed. Please complete the previous stage first.",
            });
        }


        // Store in Redis for next time (e.g. 15 min TTL)
       if(previousStageModel.modelName !== "CostEstimation" || previousStageModel.modelName !== "PaymentConfirmationModel"){
         await redisClient.set(redisKey, JSON.stringify(doc.toObject()), { EX: 60 * 15 });
       }
        next();
    };
};
