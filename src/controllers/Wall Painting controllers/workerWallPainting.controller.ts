import { Request, Response } from "express";
import { WorkerWallPaintingModel } from "../../models/Wall Painting model/workerSideWallPainting.model"; 
import { IUpload, ICorrectionRound } from './../../models/Wall Painting model/workerSideWallPainting.model';
import { AdminWallPaintingModel } from "../../models/Wall Painting model/AdminSideWallPainting.model";

// 1️⃣ Upload initial files
 const uploadWorkerInitialFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepNumber } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." , ok:false});
    }

    const uploads: IUpload[] = files.map((file) => ({
      type: file.mimetype.includes("pdf") ? "pdf" : "image",
      url: (file as any).location,
      originalName: file.originalname,
      uploadedAt: new Date(),
    }));

    // ➜ Update Worker SOP step by step _id
    await WorkerWallPaintingModel.updateOne(
      { projectId, "steps.stepNumber": stepNumber },
      { $push: { "steps.$.initialUploads": { $each: uploads } } }
    );

    // ➜ Update Admin SOP step by step _id
    const data = await AdminWallPaintingModel.updateOne(
      { projectId, "steps.stepNumber": stepNumber },
      { $push: { "steps.$.workerInitialUploads": { $each: uploads } } }
    );
console.log("data", data)
    return res.status(200).json({ ok: true, message: "Initial uploads saved to both Worker & Admin." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to upload initial files." });
  }
};


//  const uploadWorkerCorrectionFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, stepId } = req.params;
//     const { roundNumber } = req.body;
//     const files = req.files as Express.Multer.File[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     const uploads: IUpload[] = files.map((file) => ({
//       type: file.mimetype.includes("pdf") ? "pdf" : "image",
//       url: (file as any).location,
//       originalName: file.originalname,
//       uploadedAt: new Date(),
//     }));

//     // Add correction uploads to the matching round
//     await WorkerWallPaintingModel.updateOne(
//       {
//         projectId,
//         "steps._id": stepId,
//         "steps.correctionRounds.roundNumber": roundNumber,
//       },
//       {
//         $push: {
//           "steps.$[step].correctionRounds.$[round].workerCorrectedUploads": { $each: uploads },
//         },
//       },
//       {
//         arrayFilters: [
//           { "step._id": stepId },
//           { "round.roundNumber": Number(roundNumber) },
//         ],
//       }
//     );

//     return res.status(200).json({ ok: true, message: "Correction uploads saved to Worker SOP." });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Failed to upload correction files." });
//   }
// };

 const uploadWorkerCorrectionFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepNumber, correctionRound} = req.params;
    const files = req.files as Express.Multer.File[];
console.log("step number",stepNumber)
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded.", ok: false });
    }

    const uploads: IUpload[] = files.map((file) => ({
      type: file.mimetype.includes("pdf") ? "pdf" : "image",
      url: (file as any).location,
      originalName: file.originalname,
      uploadedAt: new Date(),
    }));

    // 1️⃣ ➜ Find latest round number in this step
    const workerDoc = await WorkerWallPaintingModel.findOne(
      { projectId, "steps.stepNumber": stepNumber },
      { "steps.$": 1 }
    ).lean();

    if (!workerDoc) {
      return res.status(404).json({ message: "Step not found.", ok: false });
    }

    const step = workerDoc.steps[0];
    if (!step) {
      return res.status(404).json({ message: "Step not found.", ok: false });
    }

    // const latestRound = step.correctionRounds?.length
    //   ? step.correctionRounds[step.correctionRounds.length - 1].roundNumber
    //   : null;

    // if (!latestRound) {
    //   return res.status(400).json({ message: "No admin correction round exists yet.", ok: false });
    // }

    // 2️⃣ ➜ Update ONLY the latest round’s workerCorrectedUploads
    await WorkerWallPaintingModel.updateOne(
      { projectId, "steps.stepNumber": stepNumber, "steps.correctionRounds.roundNumber": correctionRound },
      {
        $set: {
          "steps.$[step].correctionRounds.$[round].workerCorrectedUploads": uploads,
        },
      },
      {
        arrayFilters: [
          { "step.stepNumber": stepNumber },
          { "round.roundNumber": correctionRound },
        ],
      }
    );

    // 3️⃣ ➜ Also update Admin side’s workerInitialUploads with latest correction files
    await AdminWallPaintingModel.updateOne(
      { projectId, "steps.stepNumber": stepNumber },
      {
        $set: {
          "steps.$.workerInitialUploads": uploads,
        },
      }
    );

    return res.status(200).json({ ok: true, message: "Correction files uploaded. Latest worker files synced to Admin." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to upload correction files." });
  }
};


 const getWorkerStepDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, stepId } = req.params;

    console.log("stepId", stepId)
    const doc = await WorkerWallPaintingModel.findOne(
      { projectId, "steps._id": stepId },
      { "steps.$": 1 }
    );

    if (!doc || doc.steps.length === 0) {
      return res.status(404).json({ message: "Step not found." });
    }

    return res.status(200).json({ ok: true, data: doc.steps[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to get step details." });
  }
};




const getWorkerSOP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const result = await WorkerWallPaintingModel.findOne({ projectId }).lean();

    if (!result) {
      return res.status(404).json({ ok: false, message: "Worker SOP not found." });
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Failed to get Worker SOP details." });
  }
};




export {
  uploadWorkerInitialFiles,
  uploadWorkerCorrectionFiles,
  getWorkerStepDetails,
  getWorkerSOP
};
