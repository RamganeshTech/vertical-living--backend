// controllers/stageDocumentation.controller.ts
import { Request, Response } from "express";
import { StageDocumentationModel } from "../../models/Documentation Model/documentation.model";
import { RoleBasedRequest } from "../../types/types";
import { Types } from "mongoose"
import { STAGE_KEY_DOCMENTION_MAP } from "../../constants/BEconstants";
import { getSignedViewUrlForPdf } from "../../utils/s3Uploads/s3SignedUrlDoc";
import { generateStagePDF } from "./pdfDocument.controller";
import { imageUploadToS3 } from "../../utils/s3Uploads/s3upload";
import { s3, S3_BUCKET } from "../../utils/s3Uploads/s3Client";
import ClientModel from "../../models/client model/client.model";
import { sendClientStageEmail } from "../../utils/Common Mail Services/DocMailToClient";



export const syncDocumentationModel = async (projectId: string | Types.ObjectId) => {
  await StageDocumentationModel.create({
    projectId,
    stages: []
  })
}


const addOrUpdateStageDocumentation = async ({ projectId, stageNumber, description, uploadedFiles = [], price }: {
  projectId: string;
  stageNumber: string;
  description: string;
  uploadedFiles?: { type: "image" | "pdf", url: string; originalName: string }[];
  price?: number | null
}) => {

  // console.log("uploadedFiles form addor upadate util", uploadedFiles)

  const stageKey = STAGE_KEY_DOCMENTION_MAP[stageNumber];
  if (!stageKey) {
    return
  }

  const doc = await StageDocumentationModel.findOne({ projectId });

  if (!doc) {
    return;
  }

  const stageIndex = doc.stages.findIndex((stage) => stage.stageKey === stageKey);
  const shouldAddPrice = stageNumber === "6" || stageNumber === "7";


  // Use uploaded files as-is (public URLs)
  const uploadedFilesWithPublicUrls = uploadedFiles;

  // ✅ Generate PDF buffer from content
  const pdfBuffer = await generateStagePDF({
    stageKey,
    stageNumber,
    description,
    uploadedFiles: uploadedFilesWithPublicUrls,
    price: shouldAddPrice ? price || 0 : undefined,
  });


  // ✅ Upload the PDF to S3
  const pdfS3Key = `stage-documents/${projectId}-stage${stageNumber}-document.pdf`;
  const uploadResult = await s3
    .upload({
      Bucket: S3_BUCKET,
      Key: pdfS3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      // ACL: "public-read",
    })
    .promise();

  const pdfLink = uploadResult.Location; // ✅ public URL


  const client = await ClientModel.findOne({ projectId });
  if (client?.email) {
    await sendClientStageEmail({
      to: client.email,
      clientName: client.clientName,
      stageName: STAGE_KEY_DOCMENTION_MAP[stageNumber],
      pdfUrl: pdfLink,
    });
  }

  if (stageIndex !== -1) {
    const existingStage: any = doc.stages[stageIndex];

    // const updatedFiles = [...existingStage.uploadedFiles, ...uploadedFiles]; // uncomment if you need to preserve the existing data even in the model it gets deleted
    const updatedFiles = uploadedFiles; // uncomment if you need to preserve the existing data even in the model it gets deleted
    const updatedDescription = existingStage.description || description;

    doc.stages[stageIndex] = {
      ...existingStage.toObject(),
      uploadedFiles: updatedFiles,
      description: updatedDescription,
      price: shouldAddPrice ? price : null,
      pdfLink,
    };

  } else {
    doc.stages.push({
      stageKey,
      stageNumber,
      description,
      uploadedFiles,
      price: shouldAddPrice ? price : null,
      pdfLink,

    });
  }

  await doc.save();

};


const getAllStageDocumentation = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is missing", ok: false })
    }

    const doc = await StageDocumentationModel.findOne({ projectId });

    if (!doc) {
      return res.status(200).json({ message: "No stage documentation found.", ok: true, data:null });
    }

    return res.status(200).json({ data: doc, ok: true });

  } catch (err) {
    console.error("Error in getAllStageDocumentation:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};





const getSingleStageDocumentation = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, stageNumber } = req.params;

    if (!projectId || !stageNumber) {
      return res.status(400).json({ message: "projectId or stageNumber is missing", ok: false })
    }

    const doc = await StageDocumentationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ message: "No documentation found for this project.", ok: false });
    }

    const stage = doc.stages.find((s) => s.stageNumber === stageNumber);

    if (!stage) {
      return res.status(404).json({ message: "No documentation found for this stage.", ok: false });
    }

    return res.status(200).json({ data: stage, ok: true });

  } catch (err) {
    console.error("Error in getSingleStageDocumentation:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadFilesToStage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, stageNumber } = req.params;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const uploads = files.map((file) => ({
      type: file.mimetype === "application/pdf" ? "pdf" : "image",
      url: (file as any).location,
      originalName: file.originalname,
    }));

    const doc = await StageDocumentationModel.findOneAndUpdate(
      { projectId, "stages.stageNumber": stageNumber },
      {
        $push: {
          "stages.$.uploadedFiles": { $each: uploads },
        },
      },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Stage not found.", ok: false });
    }

    res.json({ message: "Files uploaded successfully.", data: doc, ok: true });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed." });
  }
};

const deleteStageFile = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, stageNumber, fileId } = req.params;

    const doc = await StageDocumentationModel.findOneAndUpdate(
      { projectId, "stages.stageNumber": stageNumber },
      {
        $pull: {
          "stages.$.uploadedFiles": { _id: fileId },
        },
      },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Stage or file not found.", ok: false });
    }

    res.json({ message: "File deleted successfully.", data: doc, ok: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete file." });
  }
};


const updateStageDescription = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, stageNumber } = req.params;
    const { description } = req.body;

    const doc = await StageDocumentationModel.findOneAndUpdate(
      { projectId, "stages.stageNumber": stageNumber },
      {
        $set: {
          "stages.$.description": description,
        },
      },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Stage not found.", ok: false });
    }

    res.json({ message: "Description updated successfully.", data: doc, ok: true });
  } catch (error) {
    console.error("Description update error:", error);
    res.status(500).json({ message: "Failed to update description." });
  }
};



const manuallyGenerateStagePdfAndSendMail = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { projectId, stageNumber} = req.params;

    // Fetch the stage doc
    const stageDoc = await StageDocumentationModel.findOne({ projectId });
    if (!stageDoc) {
      return res.status(404).json({ message: "Stage documentation not found" });
    }

    const stageIndex = stageDoc.stages.findIndex((s) => s.stageNumber === stageNumber);
    if (stageIndex === -1) {
      return res.status(404).json({ message: "Stage not found in documentation" });
    }

    const stage = stageDoc.stages[stageIndex];


    // Generate PDF buffer
    const pdfBuffer = await generateStagePDF({
      stageKey: stage.stageKey,
      stageNumber: stage.stageNumber,
      description: stage.description,
      uploadedFiles: stage.uploadedFiles, // must contain public URLs
      price: ["6", "7"].includes(stage.stageNumber) ? stage.price || 0 : undefined,
    });

    const pdfS3Key = `stage-documents/${projectId}-stage${stage.stageNumber}-document.pdf`;

    const uploadResult = await s3
      .upload({
        Bucket: S3_BUCKET,
        Key: pdfS3Key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
      .promise();

    const pdfLink = uploadResult.Location;

    // Save link into that specific stage
    stageDoc.stages[stageIndex].pdfLink = pdfLink;
    await stageDoc.save();

    // Send email to client
    // await sendClientStageEmail({
    //   to: clientEmail,
    //   clientName,
    //   stageName: stage.stageKey, // or send a mapped title if needed
    //   pdfUrl: pdfLink,
    // });

    return res.status(200).json({
      message: "PDF generated, uploaded, saved and email sent",
      data: pdfLink,
    });
  } catch (err) {
    console.error("Manual PDF generation error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  addOrUpdateStageDocumentation,
  getAllStageDocumentation,
  getSingleStageDocumentation,

  uploadFilesToStage,
  deleteStageFile,
  updateStageDescription,

  manuallyGenerateStagePdfAndSendMail
}