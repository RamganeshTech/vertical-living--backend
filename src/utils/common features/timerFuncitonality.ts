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
import { PopulateOptions, Model } from "mongoose";
import { populateWithAssignedToField } from "../populateWithRedis";

export const handleSetStageDeadline = async (req: Request, res: Response, { model, stageName, populate }: { model: Model<any>; stageName: string; populate?: string | PopulateOptions | (string | PopulateOptions)[]; }): Promise<Response> => {
  try {
    const { formId, projectId } = req.params;
    let { deadLine } = req.body;

    // console.log("deadline", deadLine)

    if (!isValidObjectId(formId)) {
      return res.status(400).json({ ok: false, message: "Form Id required" });
    }

    // If the input has no time, add "T00:00:00"
    if (deadLine && deadLine.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(deadLine)) {
      deadLine = `${deadLine}T00:00:00`;
    }

    const deadlineDate = new Date(deadLine);

    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ ok: false, message: "Deadline should be a valid date-time" });
    }

    const doc = await model.findById(formId);
    if (!doc) {
      return res.status(404).json({ ok: false, message: `${stageName} not found` });
    }

    if (doc.timer?.startedAt && deadlineDate < doc.timer.startedAt) {
      return res.status(400).json({
        ok: false,
        message: "Deadline must be after start time",
      });
    }

    if (!doc.timer) doc.timer = {};
    doc.timer.deadLine = deadlineDate;

    await doc.save();

    let docToCache = doc;
    if (populate) {
      docToCache = await docToCache.populate(populate);
    }

    // ✅ Then always ALSO populate assignedTo for Redis
    if (model.modelName !== "CostEstimation") {
      await populateWithAssignedToField({
        stageModel: model,
        projectId,
        dataToCache: docToCache,
      });
    }

    // if (model.modelName !== "CostEstimation") {
    //   await updateCachedeadline(model, projectId, docToCache)
    // }

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