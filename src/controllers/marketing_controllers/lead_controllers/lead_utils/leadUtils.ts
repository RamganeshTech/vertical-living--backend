
import CTOModel from "../../../../models/CTO model/CTO.model";
import StaffModel from "../../../../models/staff model/staff.model";
import UserModel from "../../../../models/usermodel/user.model";
import { WorkerModel } from "../../../../models/worker model/worker.model";
import { sendNewLeadEmail } from "../../../../utils/cronJobs/ReminderEmail/sendNotificationEmailLead";
import { NotificationType } from "../../../Notification Controller/notification.controller";
import { createNotification } from "../../../Notification Controller/notification.service";
import dotenv from 'dotenv';
dotenv.config()

interface NotifyLeadParams {
    organizationId: string;
    leadName: string;
    leadPhone: string;
    sourceTitle: string;
}

export const notifyInternalLeadSubscribers = async ({
    organizationId,
    leadName,
    leadPhone,
    sourceTitle
}: NotifyLeadParams) => {
    try {
        // Query: Match the organization AND check if they have leadmodule permission.
        const targetQuery = {
            organizationId: organizationId,
            // "permissions.leadmodule": true
            $or: [
                { "permission.leadmodule.create": true },
                { "permission.leadmodule.edit": true },
                { "permission.leadmodule.delete": true },
                { "permission.leadmodule.list": true }
            ]
        };

        // Query all 4 models simultaneously for performance
        const [users, staffs, ctos, workers] = await Promise.all([
            UserModel.find(targetQuery).select('_id email').lean(),
            StaffModel.find(targetQuery).select('_id email').lean(),
            CTOModel.find(targetQuery).select('_id email').lean(),
            WorkerModel.find(targetQuery).select('_id email').lean(),
        ]);

        // Combine all found users and attach their specific model name
        const notificationTargets = [
            ...users.map(u => ({ id: u._id, email: u.email, model: "UserModel" })),
            ...staffs.map(s => ({ id: s._id, email: s.email, model: "StaffModel" })),
            ...ctos.map(c => ({ id: c._id, email: c.email, model: "CTOModel" })),
            ...workers.map(w => ({ id: w._id, email: w.email, model: "WorkerModel" })),
        ];

        if (notificationTargets.length === 0) {
            console.log("No users found with leadmodule permission.");
            return;
        }
        const targetRoute = sourceTitle === "Cost Calculator"
            ? `publiccostcalculation`
            : `publicleadcollection`;


        // ✅ DYNAMIC URL LOGIC
        // const targetUrl = sourceTitle === "Cost Calculator"
        //     ? `/organizations/${organizationId}/projects/publiccostcalculation`
        //     : `/organizations/${organizationId}/projects/publicleadcollection`;

        const relativeUrl = `/organizations/${organizationId}/projects/${targetRoute}`;


        const fullCrmUrl = `${process.env.FRONTEND_URL}/organizations/${organizationId}/projects/${targetRoute}`;

        // Create the notification for every matched user
        const notifyPromises = notificationTargets.map(target =>
            createNotification({
                organizationId: organizationId,
                userId: target.id.toString() as any, // Cast to match your DTO
                userModel: target.model as any,
                message: `New Lead Arrived: ${leadName} via ${sourceTitle}`,
                type: NotificationType.INFO,
                fromModule: 'leadmodule',
                navigation: {
                    url: relativeUrl, // Adjust this to your actual leads route
                    label: 'View Lead',
                },
                projectId: null
            })
        );

        await Promise.all(notifyPromises);

        // 2. Send the Email Alert
        // Filter out targets that might not have an email address
        const emailList = notificationTargets.map(t => t.email).filter(Boolean) as string[];

        if (emailList.length > 0) {
            await sendNewLeadEmail({
                to: emailList,
                leadName: leadName,
                leadPhone: leadPhone,
                sourceTitle: sourceTitle,
                crmLink: fullCrmUrl
            });
            console.log(`✉️ Email notification sent to ${emailList.length} users.`);
        }


        // console.log(`✅ Lead notification sent to ${notificationTargets.length} internal users.`);
        console.log(`✅ CRM notification sent via ${sourceTitle} to ${notificationTargets.length} users.`);

    } catch (error) {
        console.error("❌ Error notifying lead subscribers:", error);
    }
};