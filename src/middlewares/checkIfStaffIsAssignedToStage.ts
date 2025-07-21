import { Request, Response, NextFunction } from "express";
import { RoleBasedRequest } from "../types/types";
import redisClient from '../config/redisClient';
import { assignedTo, selectedFields } from "../constants/BEconstants";

export const checkIfStaffIsAssignedToStage = (
    model: any, // default field for staff assignment
): any => {
    return async (req: RoleBasedRequest, res: Response, next: NextFunction) => {
        try {
            const { projectId } = req.params;
            const userId = req.user?._id;
            const userRole = req.user?.role;

            if (userRole !== "staff") return next(); // skip check for non-staff
            
            const stageName = model.modelName; // Get model name like "MaterialRoomConfirmation"
            const redisKey = `stage:${stageName}:${projectId}`;

            let stageData: any;
            // await redisClient.del(redisKey)
      const skipRedis = stageName === "CostEstimation" || stageName === "PaymentConfirmationModel";

      if (!skipRedis) {
            const cached = await redisClient.get(redisKey);
            if (cached) {
                console.log("gtting in the if part of check middleware")

                stageData = JSON.parse(cached);
            } else {
                // Fallback to DB
                console.log("gtting in the else part of check middleware")
                stageData = await model.findOne({ projectId }).populate(assignedTo , selectedFields);
                if (!stageData) {
                    return res.status(404).json({ message: "Stage data not found", ok: false });
                }

                await redisClient.set(redisKey, JSON.stringify(stageData.toObject()), { EX: 60 * 10 }); // 10 min cache
            }
        }
        else {
        console.log("Skipping Redis entirely for:", stageName);
        stageData = await model.findOne({ projectId }).populate(assignedTo, selectedFields);
        if (!stageData) {
          return res.status(404).json({ message: "Stage data not found", ok: false });
        }
      }

            const assignedToID = stageData?.["assignedTo"]._id;


            console.log("assignedTo", assignedToID)

            if (!assignedToID || assignedToID.toString() !== userId) {
                return res.status(400).json({ message: "Access denied: youre not assigned to this stage", ok: false });
            }
                console.log("getting outside of else conditionn")

            return next();
        } catch (err) {
            console.error("Staff assignment middleware error:", err);
            return res.status(500).json({ message: "Internal Server Error", ok: false });
        }
    };
};