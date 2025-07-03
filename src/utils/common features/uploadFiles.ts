// controllers/common/uploadGeneric.controller.ts
import { Request, Response } from "express";
import { Model } from "mongoose";
import redisClient from "../../config/redisClient";

interface UploadEntry {
  type: "image" | "pdf";
  url: string;
  originalName: string;
  uploadedAt: Date;
}

export const uploadGenericController = (ModelRef: Model<any>) => async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("enting tnot upload controler")

    const { formId , projectId} = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const doc = await ModelRef.findById(formId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!Array.isArray((doc as any).uploads)) {
      (doc as any).uploads = [];
    }

    for (const file of files) {
      const fileType = file.mimetype.includes("pdf") ? "pdf" : "image";

      (doc as any).uploads.push({
        type: fileType,
        url: (file as any).transforms?.[0]?.location || (file as any).location,
        originalName: file.originalname,
        uploadedAt: new Date(),
      } as UploadEntry);
    }

    await doc.save();


    const redisKeyMain = `stage:${ModelRef.modelName}:${projectId}`
    await redisClient.set(redisKeyMain, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    return res.status(200).json({ ok: true, message: "Files uploaded", count: files.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
