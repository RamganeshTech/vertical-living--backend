// controllers/stageDocumentation.controller.ts
import { Request, Response } from "express";
import { StageDocumentationModel } from "../../models/Documentation Model/documentation.model";
import { RoleBasedRequest } from "../../types/types";
import { Types } from "mongoose"
import { STAGE_KEY_DOCMENTION_MAP } from "../../constants/BEconstants";



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


    const stageKey = STAGE_KEY_DOCMENTION_MAP[stageNumber];
    if (!stageKey) {
        return
    }

    const doc = await StageDocumentationModel.findOne({ projectId });

    if (!doc) {
        return;
    }

    const stageIndex = doc.stages.findIndex((stage) => stage.stageKey === stageKey);

    if (stageIndex !== -1) {
        const existingStage: any = doc.stages[stageIndex];

        // const updatedFiles = [...existingStage.uploadedFiles, ...uploadedFiles]; // uncomment if you need to preserve the existing data even in the model it gets deleted
        const updatedFiles = uploadedFiles; // uncomment if you need to preserve the existing data even in the model it gets deleted
        const updatedDescription = existingStage.description || description;

        doc.stages[stageIndex] = {
            ...existingStage.toObject(),
            uploadedFiles: updatedFiles,
            description: updatedDescription,
            price: stageNumber === "6" || stageNumber === "7" ? price : null,
        };
        
    } else {
        doc.stages.push({
            stageKey,
            stageNumber,
            description,
            uploadedFiles,
            price: stageNumber === "6" || stageNumber === "7" ? price : null,
        });
    }

    await doc.save();
    // return res.status(200).json({ message: "Stage documentation updated successfully.", data:doc.stages, ok:true });


};


const getAllStageDocumentation = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is missing", ok: false })
        }

        const doc = await StageDocumentationModel.findOne({ projectId });

        if (!doc) {
            return res.status(404).json({ message: "No stage documentation found.", ok:false });
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
            return res.status(404).json({ message: "No documentation found for this project." ,  ok:false});
        }

        const stage = doc.stages.find((s) => s.stageNumber === stageNumber);

        if (!stage) {
            return res.status(404).json({ message: "No documentation found for this stage.", ok:false });
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
      return res.status(404).json({ message: "Stage not found.",  ok:false });
    }

    res.json({ message: "Files uploaded successfully.", data: doc, ok:true });
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
      return res.status(404).json({ message: "Stage or file not found.", ok:false });
    }

    res.json({ message: "File deleted successfully.", data: doc, ok:true });
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
      return res.status(404).json({ message: "Stage not found.", ok:false });
    }

    res.json({ message: "Description updated successfully.", data: doc, ok:true });
  } catch (error) {
    console.error("Description update error:", error);
    res.status(500).json({ message: "Failed to update description." });
  }
};


export {
    addOrUpdateStageDocumentation,
    getAllStageDocumentation,
    getSingleStageDocumentation,

    uploadFilesToStage,
    deleteStageFile,
    updateStageDescription
}