// utils/sendMail.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g. your@gmail.com
    pass: process.env.EMAIL_PASS, // app password
  },
});

export const sendClientStageEmail = async ({
  to,
  clientName,
  stageName,
  pdfUrl,
}: {
  to: string;
  clientName: string;
  stageName: string;
  pdfUrl: string;
}) => {
  const info = await transporter.sendMail({
    from: `Vertical Living <${process.env.EMAIL_USER}>`,
    to,
    subject: `📦 Project Update – ${stageName} Documentation Ready`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e2e2; border-radius: 8px; padding: 24px; background-color: #f9f9f9;">
        <h2 style="color: #4A90E2;">Hello ${clientName},</h2>
        <p style="font-size: 16px; color: #333;">
          We’re excited to inform you that the documentation for your project stage 
          <strong style="color: #000;">"${stageName}"</strong> has been successfully completed and is now available for your review.
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${pdfUrl}" 
             style="background-color: #4A90E2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            📄 View Documentation
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
        <p style="font-size: 14px; color: #999;">
          — Team Vertical Living<br/>
        </p>
      </div>
    `,
  });

//   console.log("Email sent: ", info.messageId);
};
