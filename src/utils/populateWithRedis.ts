import { Model } from "mongoose"
import { assignedTo, selectedFields } from "../constants/BEconstants"
import redisClient from "../config/redisClient"

export const populateWithAssignedToField = async ({stageModel, dataToCache,projectId}:{stageModel:Model<any>, dataToCache:any ,projectId:string}) => {
  const populateData = await dataToCache.populate(assignedTo, selectedFields)

  const redisMainKey = `stage:${stageModel.modelName}:${projectId}`
  await redisClient.set(redisMainKey, JSON.stringify(populateData.toObject()), {EX:60 * 10})
}