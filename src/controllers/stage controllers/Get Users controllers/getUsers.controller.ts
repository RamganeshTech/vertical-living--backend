import { Request, Response } from "express";
import CTOModel from "../../../models/CTO model/CTO.model";
import UserModel from "../../../models/usermodel/user.model";
import StaffModel from "../../../models/staff model/staff.model";
import ClientModel from "../../../models/client model/client.model";
import { WorkerModel } from "../../../models/worker model/worker.model";
import redisClient from "../../../config/redisClient";
import { Model } from "mongoose";

const  getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { role, organizationId } = req.params;

        if (!role || !organizationId) {
            return res.status(400).json({ message: "Missing role or organizationId", ok: false });
        }

        const cacheKey = `getusers:${role}:${organizationId}`;
// await redisClient.del(cacheKey);
        // Try Redis cache first
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            // console.log("Using cached data");
            return res.status(200).json({ data: JSON.parse(cached), ok: true });
        }

        let Model:Model<any>;
            let projection: string;

       switch (role.toLowerCase()) {
      case "staff":
        Model = StaffModel;
        projection = "_id staffName email role";
        break;
      case "owner":
        Model = UserModel;
        projection = "_id username email role";
        break;
      case "cto":
        Model = CTOModel;
        projection = "_id CTOName email role";
        break;
      case "client":
        Model = ClientModel;
        projection = "_id clientName email role";
        break;
      case "worker":
        Model = WorkerModel;
        projection = "_id workerName email role";
        break;
      default:
        return res.status(400).json({ message: "Invalid role", ok: false });
    }

        // Find users with the given organizationId
        const users = await Model.find({ organizationId: organizationId }).select(projection);

        // console.log("users",users)
        // Cache the result for 5 minutes
        await redisClient.set(cacheKey, JSON.stringify(users), {EX:60 * 10});

        return res.status(200).json({ data: users, ok: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};


export { getUsers }