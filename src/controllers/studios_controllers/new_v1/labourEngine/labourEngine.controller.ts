// labourEngine.controller.ts
/**
 * Labour Engine settings for the whole firm: read by everyone who works on studios, saved by owner, CTO and
 * staff (answer G2). Every save keeps who, when, what and the full settings, so any version can be restored.
 */
import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import type { RoleBasedRequest } from "../studio/studio.crmImports";
import LabourEngineSettingsModel, { MAXIMUM_LABOUR_ENGINE_HISTORY } from "./labourEngine.model";
import type { ILabourEngineSettings, LabourEngineConfigData } from "./labourEngine.types";

const CONFIG_SCHEMA_NAME = "vl.labourEngine.config";
const MAXIMUM_CONFIG_SIZE_IN_BYTES = 512 * 1024;

const sendSuccess = (response: Response, statusCode: number, message: string, data: unknown): void => {
  response.status(statusCode).json({ ok: true, message, data });
};
const sendError = (response: Response, statusCode: number, message: string, errors?: string[]): void => {
  response.status(statusCode).json(errors && errors.length > 0 ? { ok: false, message, errors } : { ok: false, message });
};
const readParameter = (parameterValue: string | string[] | undefined): string | undefined =>
  Array.isArray(parameterValue) ? parameterValue[0] : parameterValue;
const readOrganizationId = (request: Request, response: Response): string | null => {
  const organizationId = readParameter(request.params.organizationId);
  if (!organizationId || !isValidObjectId(organizationId)) {
    sendError(response, 400, "Invalid organization ID");
    return null;
  }
  return organizationId;
};
const readUserId = (request: Request): Types.ObjectId | null => {
  const userId = (request as RoleBasedRequest).user?._id;
  return isValidObjectId(userId) ? new Types.ObjectId(userId) : null;
};
const readUserRole = (request: Request): string => (request as RoleBasedRequest).user?.role ?? "";

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
  typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
const isNumberInRange = (candidate: unknown, minimum: number, maximum: number): boolean =>
  typeof candidate === "number" && Number.isFinite(candidate) && candidate >= minimum && candidate <= maximum;

/** Checks the settings well enough that a bad save can never break the studio. Returns the errors found. */
export const findLabourEngineConfigErrors = (candidate: unknown): string[] => {
  if (!isRecord(candidate)) return ["config must be an object"];
  const errors: string[] = [];
  if (candidate.schema !== CONFIG_SCHEMA_NAME) errors.push(`config.schema must be "${CONFIG_SCHEMA_NAME}"`);
  if (JSON.stringify(candidate).length > MAXIMUM_CONFIG_SIZE_IN_BYTES) errors.push("config is too large");
  if (!isNumberInRange(candidate.hoursPerDay, 1, 24)) errors.push("hoursPerDay must be between 1 and 24");
  if (!isNumberInRange(candidate.helperRate, 0, 100000)) errors.push("helperRate must be between 0 and 1,00,000");
  for (const listName of ["trades", "norms", "rules", "stages"]) {
    if (!Array.isArray(candidate[listName]) || (candidate[listName] as unknown[]).length === 0) errors.push(`${listName} must be a non-empty list`);
  }
  if (errors.length > 0) return errors;

  const trades = candidate.trades as unknown[];
  const tradeKeys = new Set<string>();
  trades.forEach((trade, index) => {
    if (!isRecord(trade) || typeof trade.key !== "string" || !trade.key) return void errors.push(`trades[${index}] needs a key`);
    tradeKeys.add(trade.key);
    if (!isNumberInRange(trade.dayRate, 0, 100000)) errors.push(`trade ${trade.key}: dayRate must be between 0 and 1,00,000`);
    if (!isNumberInRange(trade.crew, 1, 100)) errors.push(`trade ${trade.key}: crew must be between 1 and 100`);
    if (!isNumberInRange(trade.maxPerRoom, 1, 100)) errors.push(`trade ${trade.key}: maxPerRoom must be between 1 and 100`);
  });
  const normKeys = new Set<string>();
  (candidate.norms as unknown[]).forEach((norm, index) => {
    if (!isRecord(norm) || typeof norm.key !== "string" || !norm.key) return void errors.push(`norms[${index}] needs a key`);
    normKeys.add(norm.key);
    if (typeof norm.trade !== "string" || !tradeKeys.has(norm.trade)) errors.push(`norm ${norm.key}: trade "${String(norm.trade)}" does not exist`);
    if (!isNumberInRange(norm.hours, 0, 1000)) errors.push(`norm ${norm.key}: hours must be between 0 and 1,000`);
    if (!isNumberInRange(norm.helperRatio, 0, 20)) errors.push(`norm ${norm.key}: helperRatio must be between 0 and 20`);
  });
  (candidate.rules as unknown[]).forEach((rule, index) => {
    if (!isRecord(rule) || typeof rule.source !== "string" || typeof rule.field !== "string" || typeof rule.norm !== "string") {
      return void errors.push(`rules[${index}] needs source, field and norm`);
    }
    for (const pattern of [rule.match, isRecord(rule.when) ? rule.when.match : undefined]) {
      if (pattern === undefined) continue;
      try {
        new RegExp(String(pattern), "i");
      } catch {
        errors.push(`rules[${index}]: pattern "${String(pattern)}" is not valid`);
      }
    }
  });
  const stageKeys = new Set((candidate.stages as unknown[]).filter(isRecord).map((stage) => String(stage.key)));
  (candidate.stages as unknown[]).forEach((stage, index) => {
    if (!isRecord(stage) || typeof stage.key !== "string" || !Array.isArray(stage.after)) return void errors.push(`stages[${index}] needs a key and an "after" list`);
    for (const previous of stage.after) if (!stageKeys.has(String(previous))) errors.push(`stage ${stage.key}: waits for unknown stage "${String(previous)}"`);
  });
  return errors.slice(0, 50);
};

/** GET: the firm's settings, or { config: null } when nothing is saved yet (the browser then uses its first settings). */
export const getLabourEngineSettings = async (request: Request, response: Response): Promise<void> => {
  try {
    const organizationId = readOrganizationId(request, response);
    if (!organizationId) return;
    const saved = await LabourEngineSettingsModel.findOne({ organizationId }, { history: 0 }).lean<ILabourEngineSettings>();
    sendSuccess(response, 200, saved ? "Labour Engine settings" : "No Labour Engine settings saved yet", saved
      ? { version: saved.version, config: saved.config, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy }
      : { version: 0, config: null, updatedAt: null, updatedBy: null });
  } catch (error) {
    console.error("getLabourEngineSettings failed", error);
    sendError(response, 500, "Could not load the Labour Engine settings");
  }
};

/** GET history: who changed what and when, newest first (without the full settings, to keep it light). */
export const getLabourEngineHistory = async (request: Request, response: Response): Promise<void> => {
  try {
    const organizationId = readOrganizationId(request, response);
    if (!organizationId) return;
    const saved = await LabourEngineSettingsModel.findOne({ organizationId }, { history: 1 }).lean<ILabourEngineSettings>();
    const history = (saved?.history ?? [])
      .map((entry) => ({ version: entry.version, changedAt: entry.changedAt, changedBy: entry.changedBy, changedByRole: entry.changedByRole, summary: entry.summary }))
      .reverse();
    sendSuccess(response, 200, "Labour Engine history", history);
  } catch (error) {
    console.error("getLabourEngineHistory failed", error);
    sendError(response, 500, "Could not load the Labour Engine history");
  }
};

/** GET one past version in full, so it can be looked at or restored. */
//  not used 
// export \

/**
 * PUT: saves new settings. Body: { baseVersion, summary, config }. baseVersion must be the version that was
 * loaded (0 for the first save), so two people editing at once cannot overwrite each other.
 */
export const saveLabourEngineSettings = async (request: Request, response: Response): Promise<void> => {
  try {
    const organizationId = readOrganizationId(request, response);
    if (!organizationId) return;
    const body: unknown = request.body;
    if (!isRecord(body)) {
      sendError(response, 400, "Request body must be a JSON object");
      return;
    }
    const baseVersion = Number(body.baseVersion);
    const summary = typeof body.summary === "string" && body.summary.trim() ? body.summary.trim().slice(0, 500) : "Edited";
    const errors = findLabourEngineConfigErrors(body.config);
    if (!Number.isInteger(baseVersion) || baseVersion < 0) errors.unshift("baseVersion is required: send the version you loaded (0 for the first save)");
    if (errors.length > 0) {
      sendError(response, 400, errors[0], errors);
      return;
    }
    const saved = await LabourEngineSettingsModel.findOne({ organizationId }, { version: 1 }).lean<ILabourEngineSettings>();
    const currentVersion = saved?.version ?? 0;
    if (currentVersion !== baseVersion) {
      response.status(409).json({ ok: false, message: "Someone else saved the Labour Engine settings. Reload and apply your change again.", currentVersion });
      return;
    }
    const nextVersion = currentVersion + 1;
    const userId = readUserId(request);
    const config = { ...(body.config as LabourEngineConfigData), version: nextVersion };
    const updated = await LabourEngineSettingsModel.findOneAndUpdate(
      { organizationId, version: saved ? currentVersion : { $exists: false } },
      {
        $set: { version: nextVersion, config, updatedBy: userId },
        $push: { history: { $each: [{ version: nextVersion, changedAt: new Date(), changedBy: userId, changedByRole: readUserRole(request), summary, 
          // config
         }], $slice: -MAXIMUM_LABOUR_ENGINE_HISTORY } },
        $setOnInsert: { organizationId: new Types.ObjectId(organizationId) },
      },
      { upsert: !saved, new: true, projection: { history: 0 } }
    ).lean<ILabourEngineSettings>();
    if (!updated) {
      response.status(409).json({ ok: false, message: "Someone else saved the Labour Engine settings. Reload and apply your change again.", currentVersion });
      return;
    }
    sendSuccess(response, 200, "Labour Engine settings saved", { version: updated.version, config: updated.config, updatedAt: updated.updatedAt, updatedBy: updated.updatedBy });
  } catch (error) {
    if (isRecord(error) && error.code === 11000) {
      sendError(response, 409, "Someone else saved the Labour Engine settings. Reload and apply your change again.");
      return;
    }
    console.error("saveLabourEngineSettings failed", error);
    sendError(response, 500, "Could not save the Labour Engine settings");
  }
};
