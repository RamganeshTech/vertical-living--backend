import { Request, Response } from "express";
import {  StageSelectionModel } from "../../../models/Modular Units Models/All Unit Model/Stage Selection Model/stageSelection.model";
import { RoleBasedRequest } from "../../../types/types";
import { ObjectId, Types } from 'mongoose';
import redisClient from "../../../config/redisClient";




export const syncSelectStage = async (projectId: string | Types.ObjectId) => {
  await StageSelectionModel.create({
    projectId,
    mode: null,
  });
}

// ✅ Upsert (create or update)
export const upsertStageSelection = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { mode } = req.body;

    if (!["Modular Units", "Manual Flow"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode.", ok: false });
    }

    const updated = await StageSelectionModel.findOneAndUpdate(
      { projectId },
      { mode },
      { new: true, upsert: true }
    );

    const redisMainKey = `stage:StageSelection:${projectId}`

    await redisClient.set(redisMainKey, JSON.stringify(updated.mode), { EX: 60 * 10 })

    return res.status(200).json({
      message: "Stage selection mode saved successfully.",
      data: updated.mode,
      ok: true
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err, ok: false });
  }
};

// ✅ Get by projectId
// export const getStageSelectionByProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;


//     const redisMainKey = `stage:StageSelection:${projectId}`

//     const cachedData = await redisClient.get(redisMainKey)

//     if (cachedData) {
//       return res.status(200).json({ data: cachedData, ok: true, message: "fetched form redis" });
//     }

//     const selection = await getStageSelectionUtil(projectId);

//     if (!selection) {
//       return res.status(404).json({ message: "Stage selection not found.", ok: true });
//     }

//     await redisClient.set(redisMainKey, JSON.stringify(selection.mode), { EX: 60 * 10 })

//     return res.status(200).json({ data: selection.mode, ok: true });
//   } catch (err) {
//     return res.status(500).json({ message: "Server error", error: err, ok: true });
//   }
// };



// const getStageSelectionUtil = async (projectId: string): Promise<IStageSelection | null> => {
//   const selection = await StageSelectionModel.findOne({ projectId });
//   return selection
// }





export const getStageSelectionByProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const selection = await getStageSelectionUtil(projectId);

    if (!selection) {
      return res.status(404).json({ message: "Stage selection not found.", ok: true });
    }

    return res.status(200).json({ data: {mode: selection.mode.mode, projectName: selection?.mode?.projectId?.projectName || ""}, ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err, ok: true });
  }
};


export const getStageSelectionUtil = async (projectId: string): Promise<any | null> => {
  const redisKey = `stage:StageSelection:${projectId}`;

  // Check Redis first
  // await redisClient.del(redisKey)
  const cached = await redisClient.get(redisKey);
  if (cached) {
    return { projectId, mode: JSON.parse(cached) }; // Return in expected IStageSelection format
  }

  // Fallback to DB
  const selection = await StageSelectionModel.findOne({ projectId }).populate("projectId");
  if (!selection) return null;
// console.log("selection form Util", selection)
  // Cache for future
  await redisClient.set(redisKey, JSON.stringify(selection.toObject()), { EX: 60 * 10 });

  return selection;
};
