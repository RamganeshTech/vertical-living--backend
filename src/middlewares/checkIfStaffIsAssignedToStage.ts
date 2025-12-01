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
            // console.log("user", req.user)
            const userId = req.user?._id;
            const userRole = req.user?.role;

            if (userRole !== "staff") return next(); // skip check for non-staff

            const stageName = model.modelName; // Get model name like "MaterialRoomConfirmation"
            const redisKey = `stage:${stageName}:${projectId}`;

            console.log("userId", userId)
            console.log("userRole", userRole)

            let stageData: any;
            // await redisClient.del(redisKey)
            const skipRedis = stageName === "CostEstimation" || stageName === "PaymentConfirmationModel";

            if (!skipRedis) {
                const cached = await redisClient.get(redisKey);
                if (cached) {

                    stageData = JSON.parse(cached);
                } else {
                    // Fallback to DB
                    stageData = await model.findOne({ projectId }).populate(assignedTo, selectedFields);
                    if (!stageData) {
                        return res.status(404).json({ message: "Stage data not found", ok: false });
                    }

                    await redisClient.set(redisKey, JSON.stringify(stageData.toObject()), { EX: 60 * 10 }); // 10 min cache
                }
            }
            else {
                // console.log("Skipping Redis entirely for:", stageName);
                stageData = await model.findOne({ projectId }).populate(assignedTo, selectedFields);
                if (!stageData) {
                    return res.status(404).json({ message: "Stage data not found", ok: false });
                }
            }
            console.log("assingeed to id is working")
            console.log("stageData", stageData)

            if (stageData?.assignedTo) {

                const assignedToID = stageData?.["assignedTo"]._id;

                console.log("assignedTo 222222222222", assignedToID)

                if (!assignedToID || assignedToID.toString() !== userId) {
                    return res.status(400).json({ message: "Access denied: youre not assigned to this stage", ok: false });
                }


                console.log("im also getting printed here ")
                return next();

            }
            else {
                console.log("2222222 it is allowing ")
                return next();

            }

        } catch (err) {
            console.error("Staff assignment middleware error:", err);
            return res.status(500).json({ message: "Internal Server Error", ok: false });
        }
    };
};