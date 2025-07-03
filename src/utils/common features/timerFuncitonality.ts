// utils/timerFunctionlity.util.ts
export const timerFunctionlity = (
  stageDoc: any,
  field: "startedAt" | "completedAt" | "deadLine",
  date: Date = new Date()
) => {
  if (!stageDoc.timer) stageDoc.timer = {};
  stageDoc.timer[field] = date;
};

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { updateCachedeadline } from "../updateStageStatusInCache ";
import { Model } from "mongoose";

export const handleSetStageDeadline = async (req: Request, res: Response, { model, stageName }: { model: Model<any>; stageName: string; }): Promise<Response> => {
  try {
    const { formId, projectId } = req.params;
    const { deadLine } = req.body;

    // console.log("deadline", deadLine)

    if (!isValidObjectId(formId)) {
      return res.status(400).json({ ok: false, message: "Form Id required" });
    }

    const deadlineDate = new Date(deadLine);

    if (!(deadlineDate instanceof Date) || isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ ok: false, message: "Deadline should be a valid date" });
    }

    //  if (!isDate(deadLine)) {
    //       return res.status(400).json({ ok: false, message: "Deadline shoudl be a date" });
    //     }


    const doc = await model.findById(formId);
    if (!doc) {
      return res.status(404).json({ ok: false, message: `${stageName} not found` });
    }

    if (doc.timer?.startedAt && deadlineDate < doc.timer.startedAt) {
      return res
        .status(400)
        .json({ ok: false, message: "Deadline must be after start time" });
    }

    if (!doc.timer) doc.timer = {};
    doc.timer.deadLine = deadlineDate;

    await doc.save();

    if (model.modelName !== "CostEstimation"){
      await updateCachedeadline(model, projectId, doc)
    }

    return res.status(200).json({
      ok: true,
      message: `${stageName} deadline set successfully`,
      data: doc,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: "Server error, try again later",
    });
  }
};