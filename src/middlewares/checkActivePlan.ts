import { Response, NextFunction } from "express";
import { RoleBasedRequest } from "../types/types";
import OrganizationModel from "../models/organization models/organization.model";
import redisClient from "../config/redisClient";

export const checkActivePlan = () =>
   async (req: RoleBasedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
    const { _id, role, ownerId } = req.user!;

    const userIdToCheck = role === "owner" ? _id : ownerId;

     const redisKey = `org:plan:${userIdToCheck}`;
    //  await redisClient.del(redisKey)
      let planData = await redisClient.get(redisKey);

     if (!planData) {
      // If not cached → hit DB → write to Redis
      const org = await OrganizationModel.findOne({ userId: userIdToCheck });
     
      if (!org) {
        return res.status(404).json({ ok: false, message: "Organization not found." });
      }

      planData = JSON.stringify({
        planType: org.planType,
        planValidTill: org.planValidTill,
      });

      // Cache for 1 hour (or your choice)
      await redisClient.setEx(redisKey, 3600, planData);
    }

    const { planValidTill } = JSON.parse(planData);

    const isPlanValid = planValidTill && new Date(planValidTill) > new Date();

    if (!isPlanValid) {
      if (role === "owner") {
        return res.status(400).json({
          ok: false,
          message: "Your subscription has expired. Please renew to continue using the service.",
        });
      } else {
        return res.status(400).json({
          ok: false,
          message: "Plan expired. Please contact your owner to renew the subscription.",
        });
      }
    }

    next();
  } catch (err) {
    console.error("checkActivePlan error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
}