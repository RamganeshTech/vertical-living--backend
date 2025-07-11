import ProjectModel from "../models/project model/project.model"; 
import { Model } from "mongoose";
import { stageModels } from "../constants/BEconstants"; 
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

    const completedCount = stageStatuses.reduce((count, stage:any) => {
      return stage?.status === "completed" ? count + 1 : count;
    }, 0);

    const percentage = Math.round((completedCount / totalStages) * 100);

    await ProjectModel.updateOne(
      { _id: projectId },
      { $set: { completionPercentage: percentage } }
    );

    // console.log(
    //   `✅ Project ${projectId} completion updated to ${percentage}%`
    // );
};
