// import multer from 'multer';
// import sharp from 'sharp';
// import { s3, S3_BUCKET } from './s3Client'; // Use your existing AWS setup


// // Multer memory storage for handling file uploads in memory
// export const upload = multer({ storage: multer.memoryStorage() });


// export const uploadImageToS3 = async (file: Express.Multer.File): Promise<string> => {
//   const fileName = `${Date.now()}-${file.originalname}`;

//   const optimizedImage = await sharp(file.buffer)
//     .resize(800, 800, { fit: 'inside' })
//     .jpeg({ quality: 80 })
//     .toBuffer();

//   const params: AWS.S3.PutObjectRequest = {
//     Bucket: S3_BUCKET,
//     Key: `images/${fileName}`,
//     Body: optimizedImage,
//     ContentType: 'image/jpeg',
//     // ACL: 'public-read',
//   };
//   console.log("enting tnot uploadimagetos3")
//   const { Location } = await s3.upload(params).promise();
//   return Location;
// };


// utils/s3ImageUploader.ts
import multer from "multer";
import sharp from "sharp";
import { s3, S3_BUCKET } from "./s3Client";
import { generateS3Key } from "./generateS3key";
import { NextFunction, Request, Response } from "express";

// ------------------------
// 1️⃣ Multer Memory Storage
// ------------------------
export const imageUploadToS3 = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  },
});

// ------------------------
// 2️⃣ Universal Process Middleware
// ------------------------
export const processUploadFiles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const files: Express.Multer.File[] = [];

    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.file) {
      files.push(req.file);
    }
    console.log("requst files", req.files)
    console.log("requst file", req.file)
    if (!files.length) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    for (const file of files) {
      if (file.mimetype === "application/pdf") {
        if (file.size > 10 * 1024 * 1024) {
          return res
            .status(400)
            .json({ message: `PDF ${file.originalname} exceeds 10MB limit.` });
        }
        console.log("file", file)
        const s3Key = `pdfs/${generateS3Key(file.originalname)}`;
        const params = {
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const { Location } = await s3.upload(params).promise();
        (file as any).location = Location;
      } else if (file.mimetype.startsWith("image/")) {
        const optimized = await sharp(file.buffer)
          .resize({ width: 800 })
          .jpeg({ quality: 80 })
          .toBuffer();

        const s3Key = `images/${generateS3Key(file.originalname)}`;
        const params = {
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: optimized,
          ContentType: "image/jpeg",
        };

        const { Location } = await s3.upload(params).promise();
        (file as any).location = Location;
      }
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "File upload failed." });
  }
};
