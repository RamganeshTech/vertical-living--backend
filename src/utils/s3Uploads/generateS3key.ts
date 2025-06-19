// utils/generateS3Key.ts
import { v4 as uuidv4 } from "uuid";
import path from "path";

export const generateS3Key = (originalname: string): string => {
  const ext = path.extname(originalname);
  return `uploads/${uuidv4()}${ext}`;
};
