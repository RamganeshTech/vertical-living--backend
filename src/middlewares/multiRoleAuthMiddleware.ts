import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RoleBasedRequest } from "../types/types";

export const multiRoleAuthMiddleware =
  (...allowedRoles: string[]) =>
  async (req: RoleBasedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // console.log("usera cecess token", req.cookies.useraccesstoken)
      const ownerToken = req.cookies?.useraccesstoken;
      const ctoToken = req.cookies?.ctoaccesstoken;
      const staffToken = req.cookies?.staffaccesstoken;
      const workerToken = req.cookies?.workeraccesstoken;
      const clientToken = req.cookies?.clientaccesstoken;

      let decoded: any = null;

      if (ownerToken) {
        decoded = jwt.verify(ownerToken, process.env.JWT_ACCESS_SECRET!);
        decoded.role = "owner";
      }
      else if (ctoToken) {
       decoded = jwt.verify(ctoToken, process.env.JWT_CTO_ACCESS_SECRET!);
        decoded.role = "CTO";
      }
       else if (staffToken) {
        decoded = jwt.verify(staffToken, process.env.JWT_STAFF_ACCESS_SECRET!);
        decoded.role = "staff";
      }
       else if (clientToken) {
        decoded = jwt.verify(clientToken, process.env.JWT_CLIENT_ACCESS_SECRET!);
        decoded.role = "client";
      }
       else if (workerToken) {
        decoded = jwt.verify(workerToken, process.env.JWT_WORKER_ACCESS_SECRET!);
        decoded.role = "worker";
      } else {
        // console.log("im getting called")
        res.status(401).json({ message: "Unauthorized: Please login", ok: false });
        return;
      }

      if (!allowedRoles.includes(decoded.role)) {
        res.status(403).json({ message: "Access denied: Role not allowed", ok: false });
        return;
      }

      req.user = {
        _id: decoded._id,
        role: decoded.role,
        ownerId: decoded.ownerId || decoded._id
      };

      // console.log("owner", decoded)
      // console.log("req.user",req.user)

      next();
    } catch (error) {
      console.error("multiRoleAuth error:", error);
      res.status(401).json({ message: "Authentication failed", ok: false });
    }
  };
