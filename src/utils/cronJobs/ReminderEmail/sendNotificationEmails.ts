// utils/sendEmail.ts
import nodemailer from 'nodemailer';
import { COMPANY_NAME } from '../../../controllers/stage controllers/ordering material controller/pdfOrderHistory.controller';

export const sendDeadlineReminderEmail = async ({ to, stageName, deadline, projectName }: { to: string, stageName: string, deadline: Date, projectName: string }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const formattedDeadline = new Date(deadline).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    hour12: true,
  });


  await transporter.sendMail({
    from: `${COMPANY_NAME} Notifications <noreply@verticalliving.com>`,
    to,
    subject: `⏰ Reminder: Project Deadline for ${stageName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px;">
        <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #1c63ffb3; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${COMPANY_NAME}</h1>
            <p style="margin: 5px 0 0;">Project Stage Deadline Reminder</p>
          </div>

          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">
              This is a gentle reminder that the <strong>${stageName}</strong> stage for your project
              <strong>"${projectName}"</strong> is approaching its deadline.
            </p>

            <div style="background-color: #e8f5e9; padding: 15px; border-left: 5px solid #4CAF50; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 16px;"><strong>⏰ Deadline:</strong> ${formattedDeadline}</p>
            </div>

            <p style="font-size: 15px;">
              Please make sure any pending tasks are completed before the deadline to keep the project on schedule.
            </p>

            <p style="margin-top: 30px; font-size: 14px; color: #888;">
              — Team ${COMPANY_NAME}
            </p>
          </div>

          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 13px; color: #666;">
            <p style="margin: 0;">This is an automated message. Please do not reply directly.</p>
          </div>
        </div>
      </div>
    `,
  });
};
