// utils/checkStageDeadlines.ts
import { Model } from "mongoose";
import { getEmailsForProject } from "./getEmailsForProject";
import { sendDeadlineReminderEmail } from "./sendNotificationEmails"; 

export const checkStageDeadlines = async (StageModel : any, stageName: string) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const stages = await StageModel.find({
    'status': { $ne: 'completed' },
    'timer.deadline': { $lte: soon, $gte: now },
    'timer.reminderSent': { $ne: true },
  }).populate("projectId")

  for (const stage of stages) {
    const emails = await getEmailsForProject(stage.projectId);

    for (const email of emails) {
      await sendDeadlineReminderEmail({
        to: email,
        stageName,
        deadline: stage.timer.deadline,
        projectName: stage.projectId.projectName,
      });
    }

    // ✅ Mark reminderSent true inside nested timer
    await StageModel.findByIdAndUpdate(stage._id, {
      $set: { 'timer.reminderSent': true },
    });
  }
};
