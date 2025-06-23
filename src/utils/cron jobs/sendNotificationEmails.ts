// utils/sendEmail.ts
import nodemailer from 'nodemailer';

export const sendDeadlineReminderEmail = async ({ to, stageName, deadline, projectName }:{to:string,  stageName:string, deadline:Date, projectName:string}) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Project Notification" <noreply@yourapp.com>',
    to,
    subject: `⏰ Deadline Nearing for ${stageName}`,
    html: `
      <p>This is a reminder that the <strong>${stageName}</strong> for project ID <strong>${projectName}</strong> is nearing its deadline.</p>
      <p><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
    `
  });
};
