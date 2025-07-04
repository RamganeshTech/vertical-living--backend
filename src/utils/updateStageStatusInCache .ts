import { Model } from "mongoose";
import redisClient from "../config/redisClient";

// dont use below one
export const updateStageStatusInCache = async (model: Model<any>, projectId: string, status: string, ttl = 60 * 10) => {
  const key = `stage:${model.modelName}:${projectId}:status`;
  await redisClient.set(key, status, { EX: ttl });
};


export const updateCachedeadline = async (model: Model<any>, projectId: string, data: any, ttl = 60 * 10) => {
  await redisClient.set(`stage:${model.modelName}:${projectId}`, JSON.stringify(data), { EX: ttl })
}