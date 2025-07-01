import { Request, Response } from "express";
import { resetStages } from "../../../utils/common features/ressetStages";

export const resetStage1 = async (req: Request, res: Response):Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 1 

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
}

export const resetStage2 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 2;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};

export const resetStage3 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 3;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};

export const resetStage4 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 4;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};

export const resetStage5 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 5;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};

export const resetStage6 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 6;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};

export const resetStage7 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 7;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};



export const resetStage8 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 8;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage9 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 9;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage10 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 10;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage11 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 10;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage12 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 10;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage13 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 10;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};


export const resetStage14 = async (req: Request, res: Response): Promise<any> => {
  const { projectId } = req.params;
  const upToStageNumber = 10;

  try {
    await resetStages(projectId, upToStageNumber);
    res.status(200).json({ ok: true, message: `Stages up to ${upToStageNumber} have been reset.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to reset stages." });
  }
};





