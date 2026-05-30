// utils/sendEmail.ts
import nodemailer from 'nodemailer';
import { COMPANY_NAME } from '../../../controllers/stage controllers/ordering material controller/pdfOrderHistory.controller';

interface NewLeadEmailParams {
    to: string[]; // Array of emails or a comma-separated string
    leadName: string;
    leadPhone: string;
    sourceTitle: string; // "Cost Calculator" or "Marketing Website"
    crmLink: string;
}

export const sendNewLeadEmail = async ({ to, leadName, leadPhone, sourceTitle, crmLink }: NewLeadEmailParams) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // const receivedTime = new Date().toLocaleString('en-IN', {
    //     timeZone: 'Asia/Kolkata', // ✅ FORCE INDIAN STANDARD TIME
    //     dateStyle: 'medium',
    //     timeStyle: 'short',
    //     hour12: true,
    // });


const receivedTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
}).format(new Date());

    await transporter.sendMail({
        from: `${COMPANY_NAME} CRM <noreply@verticalliving.com>`,
        to, // Sends to all authorized users
        subject: `🚀 New Lead Alert: ${leadName} via ${sourceTitle}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; line-height: 1.6;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center;">
                        <span style="background-color: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                            Action Required
                        </span>
                        <h1 style="margin: 15px 0 0; font-size: 24px; font-weight: 600;">New Lead Captured</h1>
                    </div>

                    <!-- Body -->
                    <div style="padding: 35px 30px;">
                        <p style="font-size: 16px; color: #334155; margin-top: 0;">A new prospect has submitted their details via the <strong>${sourceTitle}</strong>.</p>
                        
                        <!-- Lead Details Card -->
                        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 100px;">Name:</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${leadName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Phone:</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                                        <a href="tel:${leadPhone}" style="color: #3b82f6; text-decoration: none;">${leadPhone}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Time:</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${receivedTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Source:</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">
                                        <span style="background-color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${sourceTitle}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Call to Action -->
                        <div style="text-align: center; margin: 35px 0 20px;">
                            <a href="${crmLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">
                                View Lead in CRM
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 5px;"><strong>${COMPANY_NAME}</strong> CRM System</p>
                        <p style="margin: 0;">This email was sent to authorized lead managers.</p>
                    </div>
                </div>
            </div>
        `,
    });
};