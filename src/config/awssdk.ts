import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import fs from 'fs';

// dotenv.config({ path: '.env.production' });
// Load from environment variables with fallback types
const accessKeyId: string = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey: string = process.env.AWS_SECRET_ACCESS_KEY!;
const region: string = process.env.AWS_REGION!;
const BUCKET_NAME: string = process.env.AWS_S3_BUCKET!;

// Configure AWS
AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

export const s3 = new AWS.S3();
export const S3_BUCKET = BUCKET_NAME;

// Function to upload a file to S3
export const uploadFile = async (filePath: string, key: string): Promise<AWS.S3.ManagedUpload.SendData> => {
    const fileContent = fs.readFileSync(filePath);
    
    const params: AWS.S3.PutObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
};
