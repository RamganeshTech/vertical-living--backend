/**
 * Studio service: business logic and routes in one module (the routes call these handlers directly).
 * Mount it once in the app, for example:   app.use("/api/studio", StudiosRoutes);
 *
 *   POST   /:organizationId/create                         create a studio (quoteName, optional projectId)
 *   PUT    /:organizationId/:studioId/upload-floor-plan    upload the plan (field "file") and save extracted rooms
 *   GET    /:organizationId                                list (query: projectId, status, search, page, pageSize)
 *   GET    /:organizationId/:studioId                      one studio → { ok: true, data: studio }
 *   PUT    /:organizationId/:studioId                      update (rooms, appearance, pricing, studio rates; needs "version")
 *   PUT    /:organizationId/:studioId/price-lock           lock or unlock prices (owner and CTO)
 *   PUT    /:organizationId/:studioId/upload-price-list    store a vendor price list (field "file") and the rates matched from it
 *   POST   /:organizationId/:studioId/share-links          create a read-only 360° link (expiresInDays, showsPrices)
 *   DELETE /:organizationId/:studioId/share-links/:shareLinkId   revoke a link
 *   GET    /shared/:shareToken                             PUBLIC: the studio as the client sees it (no sign-in)
 *   GET    /:organizationId/settings                       Studio settings (letterhead, quotation defaults, percentages, staff limits)
 *   PUT    /:organizationId/settings                       save Studio settings (owner and CTO)
 *   DELETE /:organizationId/:studioId                      delete
 */
import { randomBytes } from "node:crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import type { FilterQuery, HydratedDocument } from "mongoose";
import StudioModel, { formatQuoteNumber, StudioSettingsModel } from "./studio.model";
import { DEFAULT_STAFF_ADJUSTMENT_LIMITS, MAXIMUM_SHARE_LINKS, PRICE_MANAGER_ROLES } from "./studio.constants";
import { keepLockedPrices, recalculateStudioPricing } from "./studio.pricing";
import {
  escapeRegularExpression,
  isRecord,
  isValidObjectId,
  parseCreateStudioPayload,
  parseFloorPlanUploadPayload,
  isShareToken,
  parsePriceListUploadPayload,
  parseShareLinkPayload,
  parseStudioSettingsPayload,
  parsePriceLockPayload,
  parseStudioListQuery,
  parseUpdateStudioPayload,
} from "./studio.validation";
import type { StudioRatePayload } from "./studio.validation";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  IStudio,
  StudioListItem,
  StudioListResult,
  StudioSettings,
  StudioStatus,
} from "./studio.types";
import {
  imageUploadToS3,
  multiRoleAuthMiddleware,
  processUploadFiles,
} from "./studio.crmImports";
import type { RoleBasedRequest } from "./studio.crmImports";

type StudioDocument = HydratedDocument<IStudio>;

interface ApiConflictResponse extends ApiErrorResponse {
  currentVersion: number;
}

type StudioApiResponse<ResponseData> = Response<ApiSuccessResponse<ResponseData> | ApiErrorResponse | ApiConflictResponse>;

/* ------------------------------------------------------------------ */
/* Response helpers                                                    */
/* ------------------------------------------------------------------ */

const sendSuccess = <ResponseData>(
  response: StudioApiResponse<ResponseData>,
  statusCode: number,
  message: string,
  data: ResponseData
): void => {
  response.status(statusCode).json({ ok: true, message, data });
};

const sendError = (response: Response, statusCode: number, message: string, errors?: string[]): void => {
  const errorBody: ApiErrorResponse = errors && errors.length > 0 ? { ok: false, message, errors } : { ok: false, message };
  response.status(statusCode).json(errorBody);
};

const isDuplicateKeyError = (error: unknown): boolean => isRecord(error) && error.code === 11000;

/** Sends the right response for an unexpected error, with a readable list for validation failures. */
const handleUnexpectedError = (response: Response, error: unknown, operationName: string, failureMessage: string): void => {
  if (error instanceof mongoose.Error.ValidationError) {
    sendError(
      response,
      400,
      "Studio data is invalid",
      Object.entries(error.errors).map(([fieldPath, fieldError]) => `${fieldPath}: ${fieldError.message}`)
    );
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    sendError(response, 400, "Studio data is invalid", [`${error.path}: ${error.message}`]);
    return;
  }
  if (error instanceof mongoose.Error.VersionError) {
    sendError(response, 409, "This studio was changed by someone else. Reload it and apply your change again.");
    return;
  }
  console.error(`${operationName} failed`, error);
  sendError(response, 500, failureMessage);
};

// Express 5 types a route parameter as string | string[]; these routes only ever give a single string.
const readParameter = (parameterValue: string | string[] | undefined): string | undefined =>
  Array.isArray(parameterValue) ? parameterValue[0] : parameterValue;

/** Validates organizationId (and studioId when present). Sends the error response and returns null when invalid. */
const readRouteIds = (
  request: Request,
  response: Response,
  needsStudioId: boolean
): { organizationId: string; studioId: string } | null => {
  const organizationId = readParameter(request.params.organizationId);
  const studioId = readParameter(request.params.studioId);
  if (!organizationId) {
    sendError(response, 400, "Organization ID is required");
    return null;
  }
  if (!isValidObjectId(organizationId)) {
    sendError(response, 400, "Invalid organization ID");
    return null;
  }
  if (needsStudioId && !isValidObjectId(studioId)) {
    sendError(response, 400, "Invalid studio ID");
    return null;
  }
  return { organizationId, studioId: studioId ?? "" };
};

const readUserId = (request: Request): Types.ObjectId | null => {
  const userId = (request as RoleBasedRequest).user?._id;
  return isValidObjectId(userId) ? new Types.ObjectId(userId) : null;
};

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Roles and organisation settings                                     */
/* ------------------------------------------------------------------ */

const readUserRole = (request: Request): string => (request as RoleBasedRequest).user?.role ?? "";

/** Owner (CEO) and CTO set rates and percentages; staff work with them and may adjust a project within limits. */
const isPriceManager = (request: Request): boolean => (PRICE_MANAGER_ROLES as readonly string[]).includes(readUserRole(request));

/** The organisation's Studio settings, or the defaults when none are saved yet (nothing is written). */
const loadStudioSettings = async (organizationId: string): Promise<StudioSettings> => {
  const saved = await StudioSettingsModel.findOne({ organizationId }).lean<StudioSettings>();
  return saved ?? new StudioSettingsModel({ organizationId: new Types.ObjectId(organizationId) }).toObject<StudioSettings>();
};

const rateFingerprint = (rates: { rateKey: string; unitPrice: number; rateConfigurationItemId?: unknown }[]): string =>
  JSON.stringify(rates.map((rate) => [rate.rateKey, rate.unitPrice, rate.rateConfigurationItemId ? String(rate.rateConfigurationItemId) : null]).sort());

const MAXIMUM_QUOTE_NUMBER_ATTEMPTS = 5;

export const createStudio = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, false);
    if (!routeIds) return;
    const payload = parseCreateStudioPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const userId = readUserId(request);
    // A new quote starts with the organisation's default percentages and quotation validity.
    const settings = await loadStudioSettings(routeIds.organizationId);
    // Two studios created at the same moment can pick the same quote number; the unique index
    // rejects the second one, so it simply tries again with the next number.
    for (let attemptNumber = 1; attemptNumber <= MAXIMUM_QUOTE_NUMBER_ATTEMPTS; attemptNumber += 1) {
      try {
        const studio = await StudioModel.create({
          organizationId: new Types.ObjectId(routeIds.organizationId),
          projectId: payload.value.projectId ? new Types.ObjectId(payload.value.projectId) : null,
          quoteName: payload.value.quoteName,
          pricingSettings: settings.pricingDefaults,
          quotationDetails: { usesOrganisationDefaults: true, validityDays: settings.quotationDefaults.validityDays },
          createdBy: userId,
          updatedBy: userId,
        });
        sendSuccess(response, 201, "Studio created successfully", studio);
        return;
      } catch (creationError) {
        if (!isDuplicateKeyError(creationError) || attemptNumber === MAXIMUM_QUOTE_NUMBER_ATTEMPTS) throw creationError;
      }
    }
  } catch (error) {
    handleUnexpectedError(response, error, "createStudio", "Could not create the studio");
  }
};

/* ------------------------------------------------------------------ */
/* Floor plan upload                                                   */
/* ------------------------------------------------------------------ */

type UploadedFloorPlanFile = Express.Multer.File & { location?: string };

export const uploadFloorPlanAndSaveRooms = async (
  request: Request,
  response: StudioApiResponse<StudioDocument>
): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const uploadedFile = request.file as UploadedFloorPlanFile | undefined;
    if (!uploadedFile) {
      sendError(response, 400, "No floor plan file provided");
      return;
    }
    if (!uploadedFile.location) {
      sendError(response, 500, "The floor plan could not be stored. Please upload it again.");
      return;
    }
    const payload = parseFloorPlanUploadPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    if (payload.value.version !== studio.version) {
      const conflictBody: ApiConflictResponse = {
        ok: false,
        message: "This studio was changed by someone else. Reload it and import the plan again.",
        currentVersion: studio.version,
      };
      response.status(409).json(conflictBody);
      return;
    }
    const { extraction } = payload.value;
    studio.set("floorPlan", {
      fileType: uploadedFile.mimetype === "application/pdf" ? "pdf" : "image",
      url: uploadedFile.location,
      originalName: uploadedFile.originalname,
      pageNumber: extraction.pageNumber,
      uploadedAt: new Date(),
    });
    studio.set("extraction", { ...extraction, source: "pdfText", extractedAt: new Date() });
    studio.set("importOptions", {
      addOpenings: payload.value.addOpenings,
      addSuggestedFurniture: payload.value.addSuggestedFurniture,
    });
    const roomsToSave =
      payload.value.importMode === "append"
        ? [...studio.toObject<IStudio>().rooms, ...payload.value.rooms]
        : payload.value.rooms;
    studio.set("rooms", roomsToSave);
    recalculateStudioPricing(studio);
    studio.version += 1;
    studio.updatedBy = readUserId(request);
    await studio.save();
    sendSuccess(response, 200, "Floor plan uploaded and rooms saved", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "uploadFloorPlanAndSaveRooms", "Could not save the floor plan");
  }
};

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

export const getStudio = async (request: Request, response: StudioApiResponse<IStudio>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId }).lean<IStudio>();
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    sendSuccess(response, 200, "Studio loaded", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "getStudio", "Could not load the studio");
  }
};

interface StudioListAggregateRow {
  _id: Types.ObjectId;
  quoteNo: string;
  quoteName: string;
  status: StudioStatus;
  projectId: Types.ObjectId | null;
  roomCount: number;
  grandTotal: number;
  hasFloorPlan: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StudioListAggregateResult {
  items: StudioListAggregateRow[];
  totalCount: { count: number }[];
}

interface ProjectNameRow {
  _id: Types.ObjectId;
  projectName?: string;
}

/** Reads project names for the listed studios. Returns an empty map if the Project model is not registered. */
const loadProjectNames = async (projectIds: Types.ObjectId[]): Promise<Map<string, string>> => {
  const projectNames = new Map<string, string>();
  if (projectIds.length === 0 || !mongoose.modelNames().includes("ProjectModel")) return projectNames;
  const projects = await mongoose
    .model("ProjectModel")
    .find({ _id: { $in: projectIds } }, { projectName: 1 })
    .lean<ProjectNameRow[]>();
  for (const project of projects) projectNames.set(String(project._id), project.projectName ?? "");
  return projectNames;
};

export const listStudios = async (request: Request, response: StudioApiResponse<StudioListResult>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, false);
    if (!routeIds) return;
    const listQuery = parseStudioListQuery(request.query);
    if (!listQuery.isValid) {
      sendError(response, 400, listQuery.errors[0], listQuery.errors);
      return;
    }
    const { projectId, status, searchText, page, pageSize } = listQuery.value;
    const matchFilter: FilterQuery<IStudio> = { organizationId: new Types.ObjectId(routeIds.organizationId) };
    if (projectId) matchFilter.projectId = new Types.ObjectId(projectId);
    if (status) matchFilter.status = status;
    if (searchText) {
      const searchPattern = new RegExp(escapeRegularExpression(searchText), "i");
      matchFilter.$or = [{ quoteName: searchPattern }, { quoteNo: searchPattern }];
    }
    const [aggregateResult] = await StudioModel.aggregate<StudioListAggregateResult>([
      { $match: matchFilter },
      { $sort: { updatedAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                quoteNo: 1,
                quoteName: 1,
                status: 1,
                projectId: 1,
                createdAt: 1,
                updatedAt: 1,
                roomCount: { $size: { $ifNull: ["$rooms", []] } },
                grandTotal: { $ifNull: ["$totals.grandTotal", 0] },
                hasFloorPlan: { $ne: [{ $ifNull: ["$floorPlan", null] }, null] },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
    const rows = aggregateResult?.items ?? [];
    const projectNames = await loadProjectNames(
      rows.map((row) => row.projectId).filter((rowProjectId): rowProjectId is Types.ObjectId => rowProjectId !== null)
    );
    const items: StudioListItem[] = rows.map((row) => ({
      ...row,
      projectName: row.projectId ? projectNames.get(String(row.projectId)) ?? "" : "",
    }));
    sendSuccess(response, 200, "Studios loaded", {
      items,
      totalCount: aggregateResult?.totalCount[0]?.count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    handleUnexpectedError(response, error, "listStudios", "Could not load the studios");
  }
};

/* ------------------------------------------------------------------ */
/* Update                                                              */
/* ------------------------------------------------------------------ */

export const updateStudio = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const payload = parseUpdateStudioPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    const changes = payload.value;
    if (changes.version !== studio.version) {
      const conflictBody: ApiConflictResponse = {
        ok: false,
        message: "This studio was changed by someone else. Reload it and apply your change again.",
        currentVersion: studio.version,
      };
      response.status(409).json(conflictBody);
      return;
    }
    const isPriceLocked = studio.priceLock?.isLocked === true;
    if (isPriceLocked && (changes.pricingSettings || changes.studioRates)) {
      sendError(response, 423, "Prices are locked for this quote. Unlock them to change rates or percentages.");
      return;
    }
    if (!isPriceManager(request)) {
      const savedSettings = studio.pricingSettings;
      if (changes.studioRates && rateFingerprint(changes.studioRates) !== rateFingerprint(studio.toObject<IStudio>().studioRates)) {
        sendError(response, 403, "Only the owner or CTO can change rates. You can adjust the project price instead.");
        return;
      }
      const changedPercentages = Object.entries(changes.pricingSettings ?? {}).filter(([settingName, settingValue]) => settingName !== "projectAdjustmentPercentage" && savedSettings[settingName as keyof typeof savedSettings] !== settingValue);
      if (changedPercentages.length > 0) {
        sendError(response, 403, "Only the owner or CTO can change labour, installation, margin or GST percentages.");
        return;
      }
      const requestedAdjustment = changes.pricingSettings?.projectAdjustmentPercentage;
      if (requestedAdjustment !== undefined && requestedAdjustment !== savedSettings.projectAdjustmentPercentage) {
        const limits = (await loadStudioSettings(routeIds.organizationId)).staffAdjustmentLimits ?? DEFAULT_STAFF_ADJUSTMENT_LIMITS;
        if (requestedAdjustment < limits.minimumPercentage || requestedAdjustment > limits.maximumPercentage) {
          sendError(response, 403, `Staff can adjust a project from ${limits.minimumPercentage}% to +${limits.maximumPercentage}%. Ask the owner or CTO for more.`);
          return;
        }
      }
    }
    if (changes.quoteName !== undefined) studio.quoteName = changes.quoteName;
    if (changes.quotationDetails) studio.set("quotationDetails", changes.quotationDetails);
    if (changes.projectId !== undefined) studio.projectId = changes.projectId ? new Types.ObjectId(changes.projectId) : null;
    if (changes.status !== undefined) studio.status = changes.status;
    if (changes.pricingSettings) {
      for (const [settingName, settingValue] of Object.entries(changes.pricingSettings)) {
        studio.set(`pricingSettings.${settingName}`, settingValue);
      }
    }
    if (changes.viewerSettings) {
      for (const [settingName, settingValue] of Object.entries(changes.viewerSettings)) {
        studio.set(`viewerSettings.${settingName}`, settingValue);
      }
    }
    if (changes.studioRates) studio.set("studioRates", changes.studioRates);
    let restoredPriceCount = 0;
    if (changes.rooms) {
      if (isPriceLocked) restoredPriceCount = keepLockedPrices(studio.toObject<IStudio>().rooms, changes.rooms);
      studio.set("rooms", changes.rooms);
    }
    recalculateStudioPricing(studio);
    studio.version += 1;
    studio.updatedBy = readUserId(request);
    await studio.save();
    sendSuccess(response, 200, restoredPriceCount > 0 ? `Studio updated. Prices are locked, so ${restoredPriceCount} saved prices were kept.` : "Studio updated successfully", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "updateStudio", "Could not update the studio");
  }
};

/* ------------------------------------------------------------------ */
/* Price lock and price lists                                          */
/* ------------------------------------------------------------------ */

const sendVersionConflict = (response: Response, currentVersion: number): void => {
  const conflictBody: ApiConflictResponse = { ok: false, message: "This studio was changed by someone else. Reload it and try again.", currentVersion };
  response.status(409).json(conflictBody);
};

/** Locks or unlocks the quote's prices. Locking stamps who and when; unlocking clears it. */
export const setPriceLock = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const payload = parsePriceLockPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    if (payload.value.version !== studio.version) {
      sendVersionConflict(response, studio.version);
      return;
    }
    const userId = readUserId(request);
    studio.set("priceLock", payload.value.isLocked ? { isLocked: true, lockedAt: new Date(), lockedBy: userId } : { isLocked: false, lockedAt: null, lockedBy: null });
    studio.version += 1;
    studio.updatedBy = userId;
    await studio.save();
    sendSuccess(response, 200, payload.value.isLocked ? "Prices locked" : "Prices unlocked", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "setPriceLock", "Could not change the price lock");
  }
};

/** Adds or replaces studio rates by rate key (rates matched from a price list replace earlier ones for the same key). */
const mergeStudioRates = (savedRates: StudioRatePayload[], incomingRates: StudioRatePayload[]): StudioRatePayload[] => {
  const byKey = new Map(savedRates.map((savedRate) => [savedRate.rateKey, savedRate]));
  for (const incomingRate of incomingRates) {
    const savedRate = byKey.get(incomingRate.rateKey);
    byKey.set(incomingRate.rateKey, savedRate?._id ? { ...incomingRate, _id: savedRate._id } : incomingRate);
  }
  return [...byKey.values()];
};

type UploadedPriceListFile = Express.Multer.File & { location?: string };

/** Stores the vendor price list (through the CRM's S3 upload, unchanged) and merges the rates the designer matched from it. */
export const uploadPriceList = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const uploadedFile = request.file as UploadedPriceListFile | undefined;
    if (!uploadedFile?.location) {
      sendError(response, 400, "No price list file was stored. Please upload it again.");
      return;
    }
    const payload = parsePriceListUploadPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    if (payload.value.version !== studio.version) {
      sendVersionConflict(response, studio.version);
      return;
    }
    if (studio.priceLock?.isLocked) {
      sendError(response, 423, "Prices are locked for this quote. Unlock them before applying a price list.");
      return;
    }
    if (!isPriceManager(request)) {
      sendError(response, 403, "Only the owner or CTO can apply a price list.");
      return;
    }
    const savedRates = studio.toObject<IStudio>().studioRates.map((savedRate) => ({ ...savedRate, _id: String(savedRate._id), rateConfigurationItemId: savedRate.rateConfigurationItemId ? String(savedRate.rateConfigurationItemId) : null }));
    studio.set("studioRates", mergeStudioRates(savedRates, payload.value.studioRates));
    const userId = readUserId(request);
    studio.priceLists.push({
      _id: new Types.ObjectId(),
      url: uploadedFile.location,
      originalName: uploadedFile.originalname,
      rowCount: payload.value.rowCount,
      appliedRateCount: payload.value.studioRates.length,
      uploadedAt: new Date(),
      uploadedBy: userId,
    });
    studio.version += 1;
    studio.updatedBy = userId;
    await studio.save();
    sendSuccess(response, 200, `Price list saved; ${payload.value.studioRates.length} rates applied`, studio);
  } catch (error) {
    handleUnexpectedError(response, error, "uploadPriceList", "Could not save the price list");
  }
};

/* ------------------------------------------------------------------ */
/* Share links (read-only 360° viewer for clients)                     */
/* ------------------------------------------------------------------ */

/** Field names that carry money or internal rate data; removed from a shared studio unless prices are shared. */
const PRICE_FIELD_NAMES = new Set([
  "unitPrice",
  "totalPrice",
  "quantity",
  "rateConfigurationItemId",
  "rateConfigurationItemName",
  "rateKey",
  "materialCost",
  "labourCost",
  "installationCost",
  "marginAmount",
  "priceBreakdown",
  "pricing",
  "wiring",
]);

const removePriceFields = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(removePriceFields);
  if (!isRecord(value)) return value;
  const cleaned: Record<string, unknown> = {};
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (PRICE_FIELD_NAMES.has(fieldName)) continue;
    cleaned[fieldName] = removePriceFields(fieldValue);
  }
  return cleaned;
};

export interface SharedStudioView {
  quoteNo: string;
  quoteName: string;
  rooms: unknown[];
  viewerSettings: IStudio["viewerSettings"];
  showsPrices: boolean;
  totals: IStudio["totals"] | null;
  gstPercentage: number | null;
  expiresAt: Date;
}

/** Creates a share link; the token is random and the only key to the public view. */
export const createShareLink = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const payload = parseShareLinkPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    if (!studio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    const activeLinks = studio.shareLinks.filter((shareLink) => !shareLink.isRevoked && shareLink.expiresAt > new Date());
    if (activeLinks.length >= MAXIMUM_SHARE_LINKS) {
      sendError(response, 400, `A studio can have at most ${MAXIMUM_SHARE_LINKS} active share links. Revoke an old one first.`);
      return;
    }
    const now = new Date();
    studio.shareLinks.push({
      _id: new Types.ObjectId(),
      token: randomBytes(24).toString("base64url"),
      showsPrices: payload.value.showsPrices,
      createdAt: now,
      expiresAt: new Date(now.getTime() + payload.value.expiresInDays * 24 * 60 * 60 * 1000),
      isRevoked: false,
      createdBy: readUserId(request),
      viewCount: 0,
    });
    // A share link is not a design change, so the version stays (no conflict with someone editing).
    await studio.save();
    sendSuccess(response, 201, "Share link created", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "createShareLink", "Could not create the share link");
  }
};

export const revokeShareLink = async (request: Request, response: StudioApiResponse<StudioDocument>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const shareLinkId = readParameter(request.params.shareLinkId);
    if (!isValidObjectId(shareLinkId)) {
      sendError(response, 400, "Invalid share link ID");
      return;
    }
    const studio = await StudioModel.findOne({ _id: routeIds.studioId, organizationId: routeIds.organizationId });
    const shareLink = studio?.shareLinks.find((candidate) => String(candidate._id) === shareLinkId);
    if (!studio || !shareLink) {
      sendError(response, 404, "Share link not found");
      return;
    }
    shareLink.isRevoked = true;
    await studio.save();
    sendSuccess(response, 200, "Share link revoked", studio);
  } catch (error) {
    handleUnexpectedError(response, error, "revokeShareLink", "Could not revoke the share link");
  }
};

/**
 * PUBLIC (no sign-in): the studio as the client may see it. Only rooms and viewer settings are sent;
 * prices only when the link was made with "show prices". Expired or revoked links answer 404.
 */
export const getSharedStudio = async (request: Request, response: StudioApiResponse<SharedStudioView>): Promise<void> => {
  try {
    const shareToken = readParameter(request.params.shareToken);
    if (!isShareToken(shareToken)) {
      sendError(response, 404, "This link is not valid");
      return;
    }
    const studio = await StudioModel.findOne({ "shareLinks.token": shareToken }).lean<IStudio>();
    const shareLink = studio?.shareLinks.find((candidate) => candidate.token === shareToken);
    if (!studio || !shareLink || shareLink.isRevoked || shareLink.expiresAt <= new Date()) {
      sendError(response, 404, "This link has expired or was turned off. Ask your designer for a new one.");
      return;
    }
    await StudioModel.updateOne({ _id: studio._id, "shareLinks._id": shareLink._id }, { $inc: { "shareLinks.$.viewCount": 1 } });
    sendSuccess(response, 200, "Shared studio", {
      quoteNo: studio.quoteNo,
      quoteName: studio.quoteName,
      rooms: shareLink.showsPrices ? studio.rooms : (removePriceFields(studio.rooms) as unknown[]),
      viewerSettings: studio.viewerSettings,
      showsPrices: shareLink.showsPrices,
      totals: shareLink.showsPrices ? studio.totals : null,
      gstPercentage: shareLink.showsPrices ? studio.pricingSettings.gstPercentage : null,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error) {
    handleUnexpectedError(response, error, "getSharedStudio", "Could not open the shared studio");
  }
};

/* ------------------------------------------------------------------ */
/* Studio settings                                                     */
/* ------------------------------------------------------------------ */

export const getStudioSettings = async (request: Request, response: StudioApiResponse<StudioSettings>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, false);
    if (!routeIds) return;
    sendSuccess(response, 200, "Studio settings", await loadStudioSettings(routeIds.organizationId));
  } catch (error) {
    handleUnexpectedError(response, error, "getStudioSettings", "Could not load the Studio settings");
  }
};

export const saveStudioSettings = async (request: Request, response: StudioApiResponse<StudioSettings>): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, false);
    if (!routeIds) return;
    const payload = parseStudioSettingsPayload(request.body);
    if (!payload.isValid) {
      sendError(response, 400, payload.errors[0], payload.errors);
      return;
    }
    const saved = await StudioSettingsModel.findOneAndUpdate(
      { organizationId: routeIds.organizationId },
      { $set: { ...payload.value, updatedBy: readUserId(request) }, $setOnInsert: { organizationId: new Types.ObjectId(routeIds.organizationId) } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean<StudioSettings>();
    sendSuccess(response, 200, "Studio settings saved", saved);
  } catch (error) {
    handleUnexpectedError(response, error, "saveStudioSettings", "Could not save the Studio settings");
  }
};

/* ------------------------------------------------------------------ */
/* Delete                                                              */
/* ------------------------------------------------------------------ */

export const deleteStudio = async (
  request: Request,
  response: StudioApiResponse<{ studioId: string; quoteNo: string }>
): Promise<void> => {
  try {
    const routeIds = readRouteIds(request, response, true);
    if (!routeIds) return;
    const deletedStudio = await StudioModel.findOneAndDelete({
      _id: routeIds.studioId,
      organizationId: routeIds.organizationId,
    }).lean<Pick<IStudio, "_id" | "quoteNo">>();
    if (!deletedStudio) {
      sendError(response, 404, "Studio not found for this organization");
      return;
    }
    sendSuccess(response, 200, "Studio deleted", { studioId: String(deletedStudio._id), quoteNo: deletedStudio.quoteNo });
  } catch (error) {
    handleUnexpectedError(response, error, "deleteStudio", "Could not delete the studio");
  }
};

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

const studioEditorRoles = multiRoleAuthMiddleware("owner", "staff", "CTO");
/** Only the owner and the CTO can lock or unlock a quote's prices. */
const priceLockRoles = multiRoleAuthMiddleware("owner", "CTO");

export const StudiosRoutes = Router();

// Public route first, so "/shared/…" is never read as an organisation and studio id. No role middleware on purpose.
StudiosRoutes.get("/shared/:shareToken", getSharedStudio);
// Settings before "/:organizationId/:studioId", so "settings" is never read as a studio id.
StudiosRoutes.get("/:organizationId/settings", studioEditorRoles, getStudioSettings);
StudiosRoutes.put("/:organizationId/settings", priceLockRoles, saveStudioSettings);
StudiosRoutes.post("/:organizationId/create", studioEditorRoles, createStudio);
StudiosRoutes.post("/:organizationId/:studioId/share-links", studioEditorRoles, createShareLink);
StudiosRoutes.delete("/:organizationId/:studioId/share-links/:shareLinkId", studioEditorRoles, revokeShareLink);
StudiosRoutes.put(
  "/:organizationId/:studioId/upload-floor-plan",
  studioEditorRoles,
  imageUploadToS3.single("file"),
  processUploadFiles,
  uploadFloorPlanAndSaveRooms
);
StudiosRoutes.put("/:organizationId/:studioId/price-lock", priceLockRoles, setPriceLock);
StudiosRoutes.put(
  "/:organizationId/:studioId/upload-price-list",
  studioEditorRoles,
  imageUploadToS3.single("file"),
  processUploadFiles,
  uploadPriceList
);
StudiosRoutes.get("/:organizationId", studioEditorRoles, listStudios);
StudiosRoutes.get("/:organizationId/:studioId", studioEditorRoles, getStudio);
StudiosRoutes.put("/:organizationId/:studioId", studioEditorRoles, updateStudio);
StudiosRoutes.delete("/:organizationId/:studioId", studioEditorRoles, deleteStudio);

export { formatQuoteNumber };
export default StudiosRoutes;
