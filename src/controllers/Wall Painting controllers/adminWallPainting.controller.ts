import { Request, Response } from "express";
import { WorkerWallPaintingModel } from "../../models/Wall Painting model/workerSideWallPainting.model"; 
import { AdminWallPaintingModel, IUpload } from "../../models/Wall Painting model/AdminSideWallPainting.model";



 const uploadAdminCorrectionRound = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepId } = req.params;
    const { adminNote } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded.", ok: false });
    }

    const uploads: IUpload[] = files.map((file) => ({
      type: file.mimetype.includes("pdf") ? "pdf" : "image",
      url: (file as any).location,
      originalName: file.originalname,
      uploadedAt: new Date(),
    }));

    // 1️⃣ ➜ Update Admin SOP: push correction files + note
    await AdminWallPaintingModel.updateOne(
      { projectId, "steps._id": stepId },
      {
        $set: { "steps.$.adminCorrectionNote": adminNote },
        $push: { "steps.$.adminCorrectionUploads": { $each: uploads } },
      }
    );

    // 2️⃣ ➜ Add new CorrectionRound in Worker SOP for same step
    const workerDoc = await WorkerWallPaintingModel.findOne(
      { projectId, "steps._id": stepId },
      { "steps.$": 1 }
    ).lean();

    if (!workerDoc) {
      return res.status(404).json({ message: "Worker step not found.", ok: false });
    }

    const step = workerDoc.steps[0];
    const nextRoundNumber = step?.correctionRounds?.length ? step.correctionRounds.length + 1 : 1;

    await WorkerWallPaintingModel.updateOne(
      { projectId, "steps._id": stepId },
      {
        $push: {
          "steps.$.correctionRounds": {
            roundNumber: nextRoundNumber,
            adminNote,
            adminUploads: uploads,
            workerCorrectedUploads: [],
          },
        },
      }
    );

    return res.status(200).json({ ok: true, message: "Correction round added to Admin & Worker models." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add admin correction round." });
  }
};



 const approveStep = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepId } = req.params;
    const {payload} = req.body
    // ➜ Mark step as approved in Admin SOP
    await AdminWallPaintingModel.updateOne(
      { projectId, "steps._id": stepId },
      { $set: { "steps.$.status": payload } }
    );

    return res.status(200).json({ ok: true, message: "Step approved." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to approve step." });
  }
};




 const getAdminStepDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepId } = req.params;

    const result = await AdminWallPaintingModel.findOne(
      { projectId, "steps._id": stepId },
      { "steps.$": 1 }
    ).lean();

    if (!result || !result.steps?.length) {
      return res.status(404).json({ ok: false, message: "Step not found." });
    }

    return res.status(200).json({
      ok: true,
      step: result.steps[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Failed to get admin step details." });
  }
};


const getAdminSOP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const result = await AdminWallPaintingModel.findOne({ projectId }).lean();

    if (!result) {
      return res.status(404).json({ ok: false, message: "Admin SOP not found." });
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Failed to get Admin SOP details." });
  }
};



export {
 uploadAdminCorrectionRound,
 approveStep,
 getAdminStepDetails,
 getAdminSOP
}