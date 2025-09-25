import ProjectModel from "../models/project model/project.model";
import { Model } from "mongoose";
import { stageModels } from "../constants/BEconstants";
import redisClient from "../config/redisClient";
// import { getStageSelectionUtil } from "../controllers/Modular Units Controllers/StageSelection Controller/stageSelection.controller";
// import { SelectedModularUnitModel } from "../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
// import { SelectedExternalModel } from "../models/externalUnit model/SelectedExternalUnit model/selectedExternalUnit.model";
/**
 * Recalculates and updates the project completion percentage.
 * @param projectId The project to update.
 */
// export const updateProjectCompletionPercentage = async (projectId: string) => {
//   const totalStages = stageModels.length;

//   // Run all stage checks in parallel:
//   const stageStatuses = await Promise.all(
//     stageModels.map((StageModel: Model<any>) =>
//       StageModel.findOne({ projectId }).select("status").lean()
//     )
//   );

//   // const completedCount = stageStatuses.reduce((count, stage:any) => {
//   //   return stage?.status === "completed" ? count + 1 : count;
//   // }, 0);

//   // const percentage = Math.round((completedCount / totalStages) * 100);
//   // console.log("stage staus", stageStatuses)
//   // const validStages = stageStatuses.filter(stage => stage !== null);

//   // console.log("validat stages", validStages)
//   const completedCount = stageStatuses.reduce((count, stage: any) => {
//     return stage?.status?.toLowerCase() === "completed" ? count + 1 : count;
//   }, 0);

//   const percentage = Math.round((completedCount / totalStages) * 100);

//   const updatedProject = await ProjectModel.findOneAndUpdate(
//     { _id: projectId },
//     { $set: { completionPercentage: percentage } },
//     { new: true }
//   );

//   if (!updatedProject) {
//     console.error(`❌ Project with ID ${projectId} not found. Skipping cache invalidation.`);
//     return;
//   }

//   await redisClient.del(`projects:${updatedProject?.organizationId}`);

//   // console.log(
//   //   `✅ Project ${projectId} completion updated to ${percentage}%`
//   // );
// };


/**
 * Recalculates and updates the project completion percentage.
 * Handles both "Manual Flow" and "Modular Units" modes.
 */
export const updateProjectCompletionPercentage = async (projectId: string) => {
  // Get mode: "Manual Flow" | "Modular Units"
  // const selection = await getStageSelectionUtil(projectId);
  // const mode = selection?.mode || "Manual Flow";

  // Clone stageModels so we can modify per mode
  let activeStageModels: Model<any>[] = [...stageModels];

  // if (mode === "Manual Flow") {
  //   // Remove modular unit models
  //   activeStageModels = activeStageModels.filter(
  //     (m) => !["SelectedModularUnitModel", "SelectedExternalModel"].includes(m.modelName)
  //   );
  // } else if (mode === "Modular Units") {
  //   // Remove manual flow models
  //   activeStageModels = activeStageModels.filter(
  //     (m) => !["MaterialRoomConfirmationModel", "CostEstimation"].includes(m.modelName)
  //   );
  // }

  // Fetch statuses for all active models
  const stageStatuses = await Promise.all(
    activeStageModels.map(async (StageModel: Model<any>) => {
      const doc = await StageModel.findOne({ projectId }).select("status").lean();
      return {
        modelName: StageModel?.modelName,  // keep track of which model
        status: Array.isArray(doc) ? null : doc?.status || null,
      };
    })
  );

  let completedCount = 0;
  let totalStages = activeStageModels.length;

  // if (mode === "Modular Units") {
    // // Handle pair collapsing
    // const modularIndexes = [
    //   stageModels.indexOf(SelectedModularUnitModel),
    //   stageModels.indexOf(SelectedExternalModel),
    // ];

    // const modularPairStatuses = modularIndexes.map((i) => stageStatuses[i]);


    // // Remove them from normal counting
    // const otherStages = stageStatuses.filter(
    //   (s) =>
    //     s &&
    //     !["selectedmodularunitmodel", "selectedexternalmodel"].includes(
    //       s.modelName.toLowerCase()
    //     )
    // );


    // // Count normal stages
    // completedCount += otherStages.reduce((count, stage: any) => {
    //   return stage?.status?.toLowerCase() === "completed" ? count + 1 : count;
    // }, 0);

    // // Collapse modular pair into 1 logical stage
    // const anyCompleted = modularPairStatuses.some(
    //   (s: any) => s?.status?.toLowerCase() === "completed"
    // );

    // if (anyCompleted) {
    //   completedCount += 1;
    // }

    // // Adjust denominator: remove 1 because pair counts as 1 stage
    // totalStages = totalStages - 1;
  // }
  //  else {
    // Manual Flow → normal counting
    completedCount = stageStatuses.reduce((count, stage: any) => {
      return stage?.status?.toLowerCase() === "completed" ? count + 1 : count;
    }, 0);
  // }

  const percentage = Math.round((completedCount / totalStages) * 100);

  const updatedProject = await ProjectModel.findOneAndUpdate(
    { _id: projectId },
    { $set: { completionPercentage: percentage } },
    { new: true }
  );

  if (!updatedProject) {
    console.error(`❌ Project with ID ${projectId} not found. Skipping cache invalidation.`);
    return;
  }

  await redisClient.del(`projects:${updatedProject.organizationId}`);

  // console.log(`✅ Project ${projectId} completion updated to ${percentage}%`);
};
