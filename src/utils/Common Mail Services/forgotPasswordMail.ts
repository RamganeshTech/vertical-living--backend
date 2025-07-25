import nodemailer from 'nodemailer';
import dotenv from "dotenv"

dotenv.config()


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    // user: "pk2262620@gmail.com",
    // pass: "kehm ifpm ozas cxbw",
  },
});

// Function to send the password reset email
export const sendResetEmail = async (email: string, userName: string, resetLink: string) => {
  const emailContent = `
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table width="600" cellpadding="20" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
              <tr>
                <td align="left">
                  <h2 style="color: #333;">Password Reset Request</h2>
                  <p>Dear ${userName},</p>
                  <p>We received a request to reset the password for your account.</p>
                  <p>To reset your password, please click the button below:</p>

                  <p style="text-align: center;">
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Reset Your Password
                    </a>
                  </p>

                  <p>This link is valid for 1 hour. If you did not request this, please ignore this email. Your account will remain secure.</p>

                  <p>Best regards,<br>
                  Vertical Living</p>

                  <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #888;">
                    If you're having trouble clicking the button above, copy and paste the following URL into your browser:<br>
                    <a href="${resetLink}" style="color: #007bff;">${resetLink}</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;


  try {
    console.log("process.env email", process.env.EMAIL_USER)
    console.log("process.env password", process.env.EMAIL_PASS)
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER, // Sender's email
      subject: 'Password Reset Request',
      html: emailContent, // HTML content
    });
    console.log('Password reset email sent!');
  } catch (error) {
      console.error("Full email error:", error); // full dump
    if (error instanceof Error)
      console.error('Error sending email: ', error.message);
    throw new Error('Error sending email');
  }
};


export default sendResetEmail;