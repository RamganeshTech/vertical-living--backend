// utils/s3ImageUploader.ts
import multer from "multer";
const multerS3 = require("multer-s3-transform");
import sharp from "sharp";
import { s3 } from "./s3Client"; 
import { generateS3Key } from "./generateS3key";

export const imageUploadToS3 = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET!,
    acl: "public-read",
    shouldTransform: (_req: Request, file: Express.Multer.File, cb: (error: any, result: boolean) => void) => {
      cb(null, file.mimetype.startsWith("image/"));
    },
    transforms: [
      {
        id: "compressed",
        key: (_req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => cb(null, generateS3Key(file.originalname)),
        transform: () =>
          sharp()
            .resize({ width: 1024 })
            .jpeg({ quality: 80 }),
      },
    ],
    key: (_req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => cb(null, generateS3Key(file.originalname)),
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
  // limits: { fileSize: 10 * 1024 * 1024 },
});