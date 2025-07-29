// utils/sendShortlistedDesignsEmail.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config()

export const sendShortlistedDesignsEmail = async ({
    clientName,
  clientEmail,
  categoryName,
  roomName,
  images,
}: {
    clientName:string
  clientEmail: string;
  categoryName: string;
  roomName: string;
  images: string[];
}) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or your provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });




  const groupedHtml = images.reduce((acc: string, url: string, idx: number) => {
  const isFirstInRow = idx % 2 === 0;
  const isLastInRow = idx % 2 === 1 || idx === images.length - 1;

  // Open a new row
  if (isFirstInRow) {
    acc += `<div style="display: flex; justify-content: space-between; margin-bottom: 16px;">`;
  }

  // Image cell
  acc += `
    <div style="width: 48%; border: 1px solid #ccc; padding: 8px; border-radius: 6px; box-sizing: border-box;">
      <img src="${url}" alt="Design Sample" style="width: 100%; height: auto; border-radius: 4px;" />
    </div>
  `;

  // Close the row
  if (isLastInRow) {
    acc += `</div>`;
  }

  return acc;
}, "");


  const htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 24px; background-color: #fdfdfd;">
    <h2 style="color: #2c3e50; text-align: center;">Hello ${clientName},</h2>
    
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      We're delighted to share a curated selection of design samples tailored for your project for category ${categoryName}. These selections reflect thoughtful design aesthetics and functional layouts to inspire your vision.
    </p>

    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      Please review the following design images. Let us know your preferences or if you'd like to explore more options!
    </p>

     ${groupedHtml}

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

    <p style="font-size: 14px; color: #999; text-align: center;">
      — Team Vertical Living
    </p>
  </div>
`

  await transporter.sendMail({
    from: `Vertical Living <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Shortlisted Designs for ${roomName}`,
    html: htmlContent,
  });
};
