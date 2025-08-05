import cron from "node-cron";
import OrganizationModel from "../../../models/organization models/organization.model";
import redisClient from "../../../config/redisClient";

// Runs daily at 12:30 AM
export const expirePlansJob = cron.schedule("30 0 * * *", async () => {
  const now = new Date();

  // Get all that are expiring now
  const expiredOrgs = await OrganizationModel.find({
    planValidTill: { $lt: now },
    planStatus: "active",
  });

  for (const org of expiredOrgs) {
    org.planStatus = "inactive";
    await org.save();

    // Also update Redis adn the key shoud be same in both here and in hte "checkActivePlan" fucntion also
    await redisClient.setEx(
      `org:plan:${org.userId}`,   
      86400, // 1 day TTL, or longer
      JSON.stringify({
        planType: org.planType,
        planValidTill: org.planValidTill,
        planStatus: "inactive",
      })
    );
  }

  console.log(`✅ Plans expired and synced Redis for: ${expiredOrgs.length} orgs`);
});



// // ✅ Actually start the cron!
// expirePlansJob.start();
// console.log("✅ Expire plans cron job started.");

// if (process.env.ENABLE_CRONS === "true") {
//   expirePlansJob.start();
//   console.log("✅ Expire plans cron job started.");
// } else {
//   console.log("⚠️ Expire plans cron job not started (disabled by config).");
// }
