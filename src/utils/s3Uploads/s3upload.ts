import multer from 'multer';
import sharp from 'sharp';
import { s3, S3_BUCKET } from './s3Client'; // Use your existing AWS setup


// Multer memory storage for handling file uploads in memory
export const upload = multer({ storage: multer.memoryStorage() });


export const uploadImageToS3 = async (file: Express.Multer.File): Promise<string> => {
  const fileName = `${Date.now()}-${file.originalname}`;

  const optimizedImage = await sharp(file.buffer)
    .resize(800, 800, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer();

    const params: AWS.S3.PutObjectRequest = {
        Bucket: S3_BUCKET,
    Key: `images/${fileName}`,
    Body: optimizedImage,
    ContentType: 'image/jpeg',
    // ACL: 'public-read',
  };
console.log("enting tnot uploadimagetos3")
  const { Location } = await s3.upload(params).promise();
  return Location;
};
