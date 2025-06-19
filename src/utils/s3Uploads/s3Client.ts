// utils/s3Client.ts
import AWS from "aws-sdk";
import dotenv  from 'dotenv';
dotenv.config(); // ✅ load env here too, just in case

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});


export const S3_BUCKET = process.env.AWS_S3_BUCKET!;