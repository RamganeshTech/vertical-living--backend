import { Request, Response } from "express";
import { StageSelectionModel } from "../../../models/Modular Units Models/All Unit Model/Stage Selection Model/stageSelection.model"; 
import { RoleBasedRequest } from "../../../types/types";
import { ObjectId, Types } from 'mongoose';




export const syncSelectStage = async (projectId:string | Types.ObjectId)=>{
     await StageSelectionModel.create({
        projectId,
        mode:null,
     });
}

// ✅ Upsert (create or update)
export const upsertStageSelection = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { projectId } = req.params;
    const { mode } = req.body;

    if (!["Modular Units", "Manual Flow"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode." , ok:false});
    }

    const updated = await StageSelectionModel.findOneAndUpdate(
      { projectId },
      { mode },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: "Stage selection mode saved successfully.",
      data: updated.mode,
      ok:true
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err, ok:false });
  }
};

// ✅ Get by projectId
export const getStageSelectionByProject = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { projectId } = req.params;

    const selection = await StageSelectionModel.findOne({ projectId });

    if (!selection) {
      return res.status(404).json({ message: "Stage selection not found." , ok:true});
    }

    return res.status(200).json({ data: selection.mode , ok:true});
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err, ok:true });
  }
};
