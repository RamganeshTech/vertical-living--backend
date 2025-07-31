import ProjectModel from "../models/project model/project.model";
import { Model } from "mongoose";
import { stageModels } from "../constants/BEconstants";
import redisClient from "../config/redisClient";
/**
 * Recalculates and updates the project completion percentage.
 * @param projectId The project to update.
 */
export const updateProjectCompletionPercentage = async (projectId: string) => {
  const totalStages = stageModels.length;

  // Run all stage checks in parallel:
  const stageStatuses = await Promise.all(
    stageModels.map((StageModel: Model<any>) =>
      StageModel.findOne({ projectId }).select("status").lean()
    )
  );

  // const completedCount = stageStatuses.reduce((count, stage:any) => {
  //   return stage?.status === "completed" ? count + 1 : count;
  // }, 0);

  // const percentage = Math.round((completedCount / totalStages) * 100);
  // console.log("stage staus", stageStatuses)
  const validStages = stageStatuses.filter(stage => stage !== null);
  // console.log("validat stages", validStages)
  const completedCount = validStages.reduce((count, stage: any) => {
    return stage.status?.toLowerCase() === "completed" ? count + 1 : count;
  }, 0);

  const percentage = Math.round((completedCount / validStages.length) * 100);

  const updatedProject = await ProjectModel.findOneAndUpdate(
    { _id: projectId },
    { $set: { completionPercentage: percentage } },
    { new: true }
  );

  if (!updatedProject) {
    console.error(`❌ Project with ID ${projectId} not found. Skipping cache invalidation.`);
    return;
  }

  await redisClient.del(`projects:${updatedProject?.organizationId}`);

  // console.log(
  //   `✅ Project ${projectId} completion updated to ${percentage}%`
  // );
};
