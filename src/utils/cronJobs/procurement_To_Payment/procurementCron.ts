import cron from 'node-cron';
import ProcurementModelNew from '../../../models/Department Models/ProcurementNew Model/procurementNew.model';

// Optional: Import your external function to move data to Accounts table
// import { syncToAccountsTable } from '../services/accountsService';

export const startProcurementAutoSync = () => {

    // Run every 5 minutes (Change to '*/2 * * * *' for 2 mins)
    cron.schedule('*/5 * * * *', async () => {
        // console.log("⏳ Checking for abandoned vendor updates...");

        try {
            // 1. Define the cutoff (30 minutes ago)
            const timeLimit = new Date(Date.now() - 30 * 60 * 1000);

            // 2. Find orders that are:
            // - Not yet synced (false or null)
            // - Not manually confirmed by staff
            // - Have been touched by shopkeeper
            // - Last touch was older than 30 mins
            const orders = await ProcurementModelNew.find({
                $or: [
                    { isSyncWithPaymentsSection: false },
                    { isSyncWithPaymentsSection: null },
                    { isSyncWithPaymentsSection: { $exists: false } }
                ],
                isConfirmedRate: { $ne: true },
                lastShopUpdateAt: { $ne: null, $lte: timeLimit }
            });

            if (orders.length === 0) {
                // Do nothing. This exits immediately and costs nothing.
                return;
            }

            console.log(`🚀 Found ${orders.length} orders to auto-sync.`);

            // 3. Process them
            for (const order of orders) {
                // Double check inside loop to be safe against race conditions
                if (order.isSyncWithPaymentsSection) continue;

                // A. Update Flags
                order.isConfirmedRate = true;
                order.isSyncWithPaymentsSection = true;

                // B. Save to DB
                await order.save();

                // C. (Optional) Call your external service to create the bill
                // await syncToAccountsTable(order);

                console.log(`✅ Auto-synced Order #${order.procurementNumber || order._id}`);
            }

        } catch (error) {
            console.error("❌ Cron Job Error:", error);
        }
    });
};