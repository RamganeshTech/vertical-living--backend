/**
 * Request parsing for the Studio module. Every function takes `unknown` input from the request
 * and returns either typed data or a list of readable error messages. Deep shape checks for rooms
 * are left to the Mongoose schema (enums, required fields, number ranges); this file makes sure
 * the top level is correct and that no client-made ids reach the database.
 */
import mongoose from "mongoose";
import {
  FLOOR_PLAN_IMPORT_MODES,
  LENGTH_UNITS,
  LIGHTING_MODES,
  MAXIMUM_LIST_PAGE_SIZE,
  MAXIMUM_QUOTE_NAME_LENGTH,
  MAXIMUM_SHARE_LINK_DAYS,
  MAXIMUM_STUDIO_RATES,
  DEFAULT_PRICING_SETTINGS,
  DEFAULT_STAFF_ADJUSTMENT_LIMITS,
  PRICE_UNITS,
  PROJECT_ADJUSTMENT_BOUNDS,
  STUDIO_RATE_SOURCES,
  STUDIO_STATUSES,
} from "./studio.constants";
import type {
  FloorPlanImportMode,
  LengthUnit,
  LightingMode,
  PaymentStage,
  PriceUnit,
  PricingSettings,
  QuotationDetails,
  StudioSettings,
  StudioRateSource,
  StudioStatus,
} from "./studio.types";

export type ParseResult<ParsedValue> = { isValid: true; value: ParsedValue } | { isValid: false; errors: string[] };

export type JsonRecord = { [fieldName: string]: unknown };

export const isRecord = (candidate: unknown): candidate is JsonRecord =>
  typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);

export const isValidObjectId = (candidate: unknown): candidate is string =>
  typeof candidate === "string" && mongoose.Types.ObjectId.isValid(candidate) && /^[0-9a-fA-F]{24}$/.test(candidate);

const isOneOf = <AllowedValue extends string | number>(
  allowedValues: readonly AllowedValue[],
  candidate: unknown
): candidate is AllowedValue => allowedValues.some((allowedValue) => allowedValue === candidate);

const isFiniteNumber = (candidate: unknown): candidate is number => typeof candidate === "number" && Number.isFinite(candidate);

/* ------------------------------------------------------------------ */
/* Ids sent by the browser                                             */
/* ------------------------------------------------------------------ */

/** Field names the browser may use as temporary render keys. They are never stored. */
const TRANSIENT_FIELD_NAMES = new Set(["clientKey", "temporaryKey"]);

/**
 * Walks any JSON value and removes `_id` values that are not real ObjectIds (new items) and any
 * transient browser keys, so the backend generates every new id itself. Existing ObjectIds are kept,
 * so edited items keep their identity.
 */
export const removeClientGeneratedIds = (jsonValue: unknown): unknown => {
  if (Array.isArray(jsonValue)) return jsonValue.map(removeClientGeneratedIds);
  if (!isRecord(jsonValue)) return jsonValue;
  const cleanedRecord: JsonRecord = {};
  for (const [fieldName, fieldValue] of Object.entries(jsonValue)) {
    if (TRANSIENT_FIELD_NAMES.has(fieldName)) continue;
    if (fieldName === "_id" && !isValidObjectId(fieldValue)) continue;
    cleanedRecord[fieldName] = removeClientGeneratedIds(fieldValue);
  }
  return cleanedRecord;
};

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export interface CreateStudioPayload {
  quoteName: string;
  projectId: string | null;
}

export const parseQuoteName = (candidate: unknown): ParseResult<string> => {
  if (typeof candidate !== "string" || !candidate.trim()) return { isValid: false, errors: ["Quote name is required"] };
  if (candidate.trim().length > MAXIMUM_QUOTE_NAME_LENGTH) {
    return { isValid: false, errors: [`Quote name must be at most ${MAXIMUM_QUOTE_NAME_LENGTH} characters`] };
  }
  return { isValid: true, value: candidate.trim() };
};

export const parseOptionalProjectId = (candidate: unknown): ParseResult<string | null> => {
  if (candidate === undefined || candidate === null || candidate === "") return { isValid: true, value: null };
  if (!isValidObjectId(candidate)) return { isValid: false, errors: ["Invalid project ID"] };
  return { isValid: true, value: candidate };
};

export const parseCreateStudioPayload = (body: unknown): ParseResult<CreateStudioPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Request body must be a JSON object"] };
  const quoteName = parseQuoteName(body.quoteName);
  const projectId = parseOptionalProjectId(body.projectId);
  const errors = [...(quoteName.isValid ? [] : quoteName.errors), ...(projectId.isValid ? [] : projectId.errors)];
  if (!quoteName.isValid || !projectId.isValid) return { isValid: false, errors };
  return { isValid: true, value: { quoteName: quoteName.value, projectId: projectId.value } };
};

/* ------------------------------------------------------------------ */
/* Update                                                              */
/* ------------------------------------------------------------------ */

export interface UpdateStudioPayload {
  version: number;
  quoteName?: string;
  projectId?: string | null;
  status?: StudioStatus;
  pricingSettings?: Partial<PricingSettings>;
  viewerSettings?: { shadowCastingLightLimit?: number; defaultLightingMode?: LightingMode };
  studioRates?: StudioRatePayload[];
  quotationDetails?: QuotationDetails;
  rooms?: JsonRecord[];
}

/** A studio rate as sent by the browser; `_id` is kept only when it is a real ObjectId. */
export interface StudioRatePayload {
  _id?: string;
  rateKey: string;
  rateConfigurationItemId: string | null;
  rateConfigurationItemName: string;
  unitPrice: number;
  unit: PriceUnit;
  source: StudioRateSource;
}

/** Checks a list of studio rates: one per rate key, a price of 0 or more, a known unit and source. */
export const parseStudioRates = (candidate: unknown, errors: string[]): StudioRatePayload[] | undefined => {
  if (candidate === undefined) return undefined;
  if (!Array.isArray(candidate)) {
    errors.push("studioRates must be an array");
    return undefined;
  }
  if (candidate.length > MAXIMUM_STUDIO_RATES) {
    errors.push(`studioRates can hold at most ${MAXIMUM_STUDIO_RATES} rates`);
    return undefined;
  }
  const seenKeys = new Set<string>();
  const parsedRates: StudioRatePayload[] = [];
  candidate.forEach((rateCandidate: unknown, rateIndex) => {
    if (!isRecord(rateCandidate)) {
      errors.push(`studioRates[${rateIndex}] must be an object`);
      return;
    }
    const { _id: rateId, rateKey, rateConfigurationItemId, rateConfigurationItemName, unitPrice, unit, source } = rateCandidate;
    if (typeof rateKey !== "string" || !/^[A-Za-z0-9.]{1,100}$/.test(rateKey)) {
      errors.push(`studioRates[${rateIndex}].rateKey must be a key such as "wall.paint"`);
      return;
    }
    if (seenKeys.has(rateKey)) {
      errors.push(`studioRates has "${rateKey}" twice`);
      return;
    }
    seenKeys.add(rateKey);
    if (!isFiniteNumber(unitPrice) || unitPrice < 0) errors.push(`studioRates[${rateIndex}].unitPrice must be a number of 0 or more`);
    if (!isOneOf(PRICE_UNITS, unit)) errors.push(`studioRates[${rateIndex}].unit must be one of: ${PRICE_UNITS.join(", ")}`);
    if (!isOneOf(STUDIO_RATE_SOURCES, source)) errors.push(`studioRates[${rateIndex}].source must be one of: ${STUDIO_RATE_SOURCES.join(", ")}`);
    if (rateConfigurationItemId !== null && rateConfigurationItemId !== undefined && !isValidObjectId(rateConfigurationItemId)) {
      errors.push(`studioRates[${rateIndex}].rateConfigurationItemId is not a valid id`);
    }
    if (!isFiniteNumber(unitPrice) || unitPrice < 0 || !isOneOf(PRICE_UNITS, unit) || !isOneOf(STUDIO_RATE_SOURCES, source)) return;
    parsedRates.push({
      ...(isValidObjectId(rateId) ? { _id: rateId } : {}),
      rateKey,
      rateConfigurationItemId: isValidObjectId(rateConfigurationItemId) ? rateConfigurationItemId : null,
      rateConfigurationItemName: typeof rateConfigurationItemName === "string" ? rateConfigurationItemName.trim().slice(0, 200) : "",
      unitPrice,
      unit,
      source,
    });
  });
  return parsedRates;
};

/* ------------------------------------------------------------------ */
/* Share links                                                         */
/* ------------------------------------------------------------------ */

export interface ShareLinkPayload {
  expiresInDays: number;
  showsPrices: boolean;
}

export const parseShareLinkPayload = (body: unknown): ParseResult<ShareLinkPayload> => {
  const record = isRecord(body) ? body : {};
  const expiresInDays = record.expiresInDays ?? 14;
  const errors: string[] = [];
  if (!isFiniteNumber(expiresInDays) || !Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > MAXIMUM_SHARE_LINK_DAYS) {
    errors.push(`expiresInDays must be a whole number from 1 to ${MAXIMUM_SHARE_LINK_DAYS}`);
  }
  if (record.showsPrices !== undefined && typeof record.showsPrices !== "boolean") errors.push("showsPrices must be true or false");
  if (errors.length > 0 || !isFiniteNumber(expiresInDays)) return { isValid: false, errors };
  return { isValid: true, value: { expiresInDays, showsPrices: record.showsPrices === true } };
};

/** Share tokens are 32 URL-safe characters (24 random bytes). */
export const isShareToken = (candidate: unknown): candidate is string => typeof candidate === "string" && /^[A-Za-z0-9_-]{32}$/.test(candidate);

/* ------------------------------------------------------------------ */
/* Price lock and price list upload                                    */
/* ------------------------------------------------------------------ */

export interface PriceLockPayload {
  version: number;
  isLocked: boolean;
}

export const parsePriceLockPayload = (body: unknown): ParseResult<PriceLockPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Request body must be a JSON object"] };
  const errors: string[] = [];
  if (!isFiniteNumber(body.version) || body.version < 1) errors.push("version is required");
  if (typeof body.isLocked !== "boolean") errors.push("isLocked must be true or false");
  if (errors.length > 0 || !isFiniteNumber(body.version) || typeof body.isLocked !== "boolean") return { isValid: false, errors };
  return { isValid: true, value: { version: body.version, isLocked: body.isLocked } };
};

export interface PriceListUploadPayload {
  version: number;
  rowCount: number;
  studioRates: StudioRatePayload[];
}

/** Multipart fields of a price list upload: version, rowCount and the rates the designer matched (JSON). */
export const parsePriceListUploadPayload = (body: unknown): ParseResult<PriceListUploadPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Form fields are missing"] };
  const errors: string[] = [];
  const versionNumber = Number(body.version);
  if (!Number.isFinite(versionNumber) || versionNumber < 1) errors.push("version is required");
  const rowCount = Number(body.rowCount ?? 0);
  if (!Number.isFinite(rowCount) || rowCount < 0) errors.push("rowCount must be a number of 0 or more");
  const ratesJson = parseJsonField("studioRates", body.studioRates, errors);
  const studioRates = ratesJson === undefined ? undefined : parseStudioRates(ratesJson, errors);
  if (errors.length > 0 || !studioRates) return { isValid: false, errors: errors.length > 0 ? errors : ["studioRates is required"] };
  return { isValid: true, value: { version: versionNumber, rowCount: Math.round(rowCount), studioRates: studioRates.map((studioRate) => ({ ...studioRate, source: "priceList" })) } };
};

export const parsePercentageGroup = (candidate: unknown, errors: string[], fieldName = "pricingSettings"): Partial<PricingSettings> | undefined => {
  if (candidate === undefined) return undefined;
  if (!isRecord(candidate)) {
    errors.push(`${fieldName} must be an object`);
    return undefined;
  }
  const parsedSettings: Partial<PricingSettings> = {};
  const settingNames: (keyof PricingSettings)[] = ["labourPercentage", "installationPercentage", "marginPercentage", "gstPercentage", "projectAdjustmentPercentage"];
  for (const settingName of settingNames) {
    const settingValue = candidate[settingName];
    if (settingValue === undefined) continue;
    const isAdjustment = settingName === "projectAdjustmentPercentage";
    const minimum = isAdjustment ? PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage : 0;
    const maximum = isAdjustment ? PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage : settingName === "gstPercentage" ? 100 : 500;
    if (!isFiniteNumber(settingValue) || settingValue < minimum || settingValue > maximum) {
      errors.push(`${fieldName}.${settingName} must be a number from ${minimum} to ${maximum}`);
      continue;
    }
    parsedSettings[settingName] = settingValue;
  }
  return parsedSettings;
};

/* ------------------------------------------------------------------ */
/* Quotation details and Studio settings                               */
/* ------------------------------------------------------------------ */

const readText = (record: JsonRecord, fieldName: string, maximumLength: number): string => (typeof record[fieldName] === "string" ? String(record[fieldName]).trim().slice(0, maximumLength) : "");

const readTextList = (candidate: unknown, fieldName: string, maximumItems: number, maximumLength: number, errors: string[]): string[] => {
  if (candidate === undefined) return [];
  if (!Array.isArray(candidate) || !candidate.every((item) => typeof item === "string")) {
    errors.push(`${fieldName} must be a list of text lines`);
    return [];
  }
  if (candidate.length > maximumItems) errors.push(`${fieldName} can have at most ${maximumItems} lines`);
  return candidate.map((item: string) => item.trim().slice(0, maximumLength)).filter(Boolean).slice(0, maximumItems);
};

/** Payment stages with percentages that add up to 100 (or no stages at all). */
const readPaymentSchedule = (candidate: unknown, fieldName: string, errors: string[]): PaymentStage[] => {
  if (candidate === undefined) return [];
  if (!Array.isArray(candidate) || !candidate.every(isRecord)) {
    errors.push(`${fieldName} must be a list of { label, percentage }`);
    return [];
  }
  const stages = candidate.slice(0, 12).map((stage: JsonRecord) => ({ label: readText(stage, "label", 200), percentage: isFiniteNumber(stage.percentage) ? stage.percentage : -1 }));
  if (stages.some((stage) => !stage.label || stage.percentage < 0 || stage.percentage > 100)) errors.push(`${fieldName}: every stage needs a name and a percentage from 0 to 100`);
  const total = stages.reduce((sum, stage) => sum + stage.percentage, 0);
  if (stages.length > 0 && Math.abs(total - 100) > 0.01) errors.push(`${fieldName}: the stages add up to ${total}%, not 100%`);
  return stages;
};

const readValidityDays = (candidate: unknown, fieldName: string, errors: string[]): number => {
  if (candidate === undefined) return 15;
  if (!isFiniteNumber(candidate) || !Number.isInteger(candidate) || candidate < 1 || candidate > 365) {
    errors.push(`${fieldName} must be a whole number of days from 1 to 365`);
    return 15;
  }
  return candidate;
};

export const parseQuotationDetails = (candidate: unknown, errors: string[]): QuotationDetails | undefined => {
  if (candidate === undefined) return undefined;
  if (!isRecord(candidate)) {
    errors.push("quotationDetails must be an object");
    return undefined;
  }
  const client = isRecord(candidate.client) ? candidate.client : {};
  return {
    client: { name: readText(client, "name", 200), phone: readText(client, "phone", 40), email: readText(client, "email", 200), address: readText(client, "address", 600), gstin: readText(client, "gstin", 20) },
    usesOrganisationDefaults: candidate.usesOrganisationDefaults !== false,
    terms: readTextList(candidate.terms, "quotationDetails.terms", 30, 600, errors),
    paymentSchedule: readPaymentSchedule(candidate.paymentSchedule, "quotationDetails.paymentSchedule", errors),
    validityDays: readValidityDays(candidate.validityDays, "quotationDetails.validityDays", errors),
    notes: readText(candidate, "notes", 2000),
  };
};

export type StudioSettingsPayload = Omit<StudioSettings, "_id" | "organizationId" | "updatedBy" | "updatedAt">;

export const parseStudioSettingsPayload = (body: unknown): ParseResult<StudioSettingsPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Request body must be a JSON object"] };
  const errors: string[] = [];
  const company = isRecord(body.company) ? body.company : {};
  const quotationDefaults = isRecord(body.quotationDefaults) ? body.quotationDefaults : {};
  const limits = isRecord(body.staffAdjustmentLimits) ? body.staffAdjustmentLimits : {};
  const production = isRecord(body.production) ? body.production : {};
  const pricingDefaults = parsePercentageGroup(body.pricingDefaults ?? {}, errors, "pricingDefaults") ?? {};
  const minimumPercentage = limits.minimumPercentage ?? DEFAULT_STAFF_ADJUSTMENT_LIMITS.minimumPercentage;
  const maximumPercentage = limits.maximumPercentage ?? DEFAULT_STAFF_ADJUSTMENT_LIMITS.maximumPercentage;
  if (!isFiniteNumber(minimumPercentage) || minimumPercentage > 0 || minimumPercentage < PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage) errors.push(`staffAdjustmentLimits.minimumPercentage must be from ${PROJECT_ADJUSTMENT_BOUNDS.minimumPercentage} to 0`);
  if (!isFiniteNumber(maximumPercentage) || maximumPercentage < 0 || maximumPercentage > PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage) errors.push(`staffAdjustmentLimits.maximumPercentage must be from 0 to ${PROJECT_ADJUSTMENT_BOUNDS.maximumPercentage}`);
  const finishes = readTextList(production.inHouseShutterFinishes, "production.inHouseShutterFinishes", 20, 40, errors);
  if (finishes.some((finish) => !/^[A-Za-z]+$/.test(finish))) errors.push("production.inHouseShutterFinishes must be finish keys such as laminateMatt");
  const settings: StudioSettingsPayload = {
    company: {
      companyName: readText(company, "companyName", 200),
      tagline: readText(company, "tagline", 300),
      addressLines: readTextList(company.addressLines, "company.addressLines", 6, 300, errors),
      phone: readText(company, "phone", 40),
      email: readText(company, "email", 200),
      website: readText(company, "website", 200),
      gstin: readText(company, "gstin", 20),
      logoUrl: readText(company, "logoUrl", 2000),
      bankDetails: readTextList(company.bankDetails, "company.bankDetails", 8, 300, errors),
    },
    quotationDefaults: {
      terms: readTextList(quotationDefaults.terms, "quotationDefaults.terms", 30, 600, errors),
      paymentSchedule: readPaymentSchedule(quotationDefaults.paymentSchedule, "quotationDefaults.paymentSchedule", errors),
      validityDays: readValidityDays(quotationDefaults.validityDays, "quotationDefaults.validityDays", errors),
      notes: readText(quotationDefaults, "notes", 2000),
    },
    pricingDefaults: { ...DEFAULT_PRICING_SETTINGS, ...pricingDefaults },
    staffAdjustmentLimits: { minimumPercentage: isFiniteNumber(minimumPercentage) ? minimumPercentage : 0, maximumPercentage: isFiniteNumber(maximumPercentage) ? maximumPercentage : 0 },
    production: { inHouseShutterFinishes: finishes },
  };
  if (errors.length > 0) return { isValid: false, errors };
  return { isValid: true, value: settings };
};

export const parseUpdateStudioPayload = (body: unknown): ParseResult<UpdateStudioPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Request body must be a JSON object"] };
  const errors: string[] = [];
  if (!isFiniteNumber(body.version) || body.version < 1) {
    errors.push("version is required: send the version you loaded, so changes made by someone else are not overwritten");
  }
  const parsedPayload: UpdateStudioPayload = { version: isFiniteNumber(body.version) ? body.version : 0 };

  if (body.quoteName !== undefined) {
    const quoteName = parseQuoteName(body.quoteName);
    if (quoteName.isValid) parsedPayload.quoteName = quoteName.value;
    else errors.push(...quoteName.errors);
  }
  if (body.projectId !== undefined) {
    const projectId = parseOptionalProjectId(body.projectId);
    if (projectId.isValid) parsedPayload.projectId = projectId.value;
    else errors.push(...projectId.errors);
  }
  if (body.status !== undefined) {
    if (isOneOf(STUDIO_STATUSES, body.status)) parsedPayload.status = body.status;
    else errors.push(`status must be one of: ${STUDIO_STATUSES.join(", ")}`);
  }
  const pricingSettings = parsePercentageGroup(body.pricingSettings, errors);
  if (pricingSettings) parsedPayload.pricingSettings = pricingSettings;

  if (body.viewerSettings !== undefined) {
    if (!isRecord(body.viewerSettings)) {
      errors.push("viewerSettings must be an object");
    } else {
      const viewerSettings: NonNullable<UpdateStudioPayload["viewerSettings"]> = {};
      const { shadowCastingLightLimit, defaultLightingMode } = body.viewerSettings;
      if (shadowCastingLightLimit !== undefined) {
        if (isFiniteNumber(shadowCastingLightLimit) && shadowCastingLightLimit >= 0 && shadowCastingLightLimit <= 16) {
          viewerSettings.shadowCastingLightLimit = Math.round(shadowCastingLightLimit);
        } else errors.push("viewerSettings.shadowCastingLightLimit must be between 0 and 16");
      }
      if (defaultLightingMode !== undefined) {
        if (isOneOf(LIGHTING_MODES, defaultLightingMode)) viewerSettings.defaultLightingMode = defaultLightingMode;
        else errors.push(`viewerSettings.defaultLightingMode must be one of: ${LIGHTING_MODES.join(", ")}`);
      }
      parsedPayload.viewerSettings = viewerSettings;
    }
  }
  const quotationDetails = parseQuotationDetails(body.quotationDetails, errors);
  if (quotationDetails) parsedPayload.quotationDetails = quotationDetails;
  const studioRates = parseStudioRates(body.studioRates, errors);
  if (studioRates) parsedPayload.studioRates = studioRates;
  if (body.rooms !== undefined) {
    if (!Array.isArray(body.rooms) || !body.rooms.every(isRecord)) errors.push("rooms must be an array of room objects");
    else parsedPayload.rooms = removeClientGeneratedIds(body.rooms) as JsonRecord[];
  }
  if (errors.length > 0) return { isValid: false, errors };
  return { isValid: true, value: parsedPayload };
};

/* ------------------------------------------------------------------ */
/* Floor plan upload (multipart: every field arrives as a string)      */
/* ------------------------------------------------------------------ */

export interface FloorPlanExtractionPayload {
  lengthUnit: LengthUnit;
  millimetresPerPixel: number;
  pageNumber: number;
  pageWidthInPixels: number;
  pageHeightInPixels: number;
  renderScale: number;
  detectedRoomCount: number;
  detectedOpeningCount: number;
  warnings: string[];
}

export interface FloorPlanUploadPayload {
  importMode: FloorPlanImportMode;
  addOpenings: boolean;
  addSuggestedFurniture: boolean;
  extraction: FloorPlanExtractionPayload;
  rooms: JsonRecord[];
  version: number;
}

const parseJsonField = (fieldName: string, rawValue: unknown, errors: string[]): unknown => {
  if (typeof rawValue !== "string") {
    errors.push(`${fieldName} is required`);
    return undefined;
  }
  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    errors.push(`${fieldName} must be valid JSON`);
    return undefined;
  }
};

const parseBooleanField = (rawValue: unknown, defaultValue: boolean): boolean =>
  rawValue === undefined ? defaultValue : rawValue === true || rawValue === "true";

const readNonNegativeNumber = (record: JsonRecord, fieldName: string, errors: string[], defaultValue: number): number => {
  const fieldValue = record[fieldName];
  if (fieldValue === undefined) return defaultValue;
  if (!isFiniteNumber(fieldValue) || fieldValue < 0) {
    errors.push(`extraction.${fieldName} must be a number of 0 or more`);
    return defaultValue;
  }
  return fieldValue;
};

export const parseFloorPlanUploadPayload = (body: unknown): ParseResult<FloorPlanUploadPayload> => {
  if (!isRecord(body)) return { isValid: false, errors: ["Form fields are missing"] };
  const errors: string[] = [];
  const importMode = body.importMode ?? "replace";
  if (!isOneOf(FLOOR_PLAN_IMPORT_MODES, importMode)) errors.push(`importMode must be one of: ${FLOOR_PLAN_IMPORT_MODES.join(", ")}`);

  const versionNumber = Number(body.version);
  if (!Number.isFinite(versionNumber) || versionNumber < 1) errors.push("version is required");

  const extractionJson = parseJsonField("extraction", body.extraction, errors);
  const roomsJson = parseJsonField("rooms", body.rooms, errors);

  let extraction: FloorPlanExtractionPayload | null = null;
  if (extractionJson !== undefined) {
    if (!isRecord(extractionJson)) errors.push("extraction must be an object");
    else {
      const lengthUnit = extractionJson.lengthUnit;
      if (!isOneOf(LENGTH_UNITS, lengthUnit)) errors.push(`extraction.lengthUnit must be one of: ${LENGTH_UNITS.join(", ")}`);
      const warnings = Array.isArray(extractionJson.warnings)
        ? extractionJson.warnings.filter((warning): warning is string => typeof warning === "string").slice(0, 200)
        : [];
      extraction = {
        lengthUnit: isOneOf(LENGTH_UNITS, lengthUnit) ? lengthUnit : "millimetre",
        millimetresPerPixel: readNonNegativeNumber(extractionJson, "millimetresPerPixel", errors, 0),
        pageNumber: Math.max(1, Math.round(readNonNegativeNumber(extractionJson, "pageNumber", errors, 1))),
        pageWidthInPixels: readNonNegativeNumber(extractionJson, "pageWidthInPixels", errors, 0),
        pageHeightInPixels: readNonNegativeNumber(extractionJson, "pageHeightInPixels", errors, 0),
        renderScale: readNonNegativeNumber(extractionJson, "renderScale", errors, 0),
        detectedRoomCount: readNonNegativeNumber(extractionJson, "detectedRoomCount", errors, 0),
        detectedOpeningCount: readNonNegativeNumber(extractionJson, "detectedOpeningCount", errors, 0),
        warnings,
      };
    }
  }
  if (roomsJson !== undefined && (!Array.isArray(roomsJson) || !roomsJson.every(isRecord))) {
    errors.push("rooms must be an array of room objects");
  }
  if (errors.length > 0 || !extraction || !Array.isArray(roomsJson) || !isOneOf(FLOOR_PLAN_IMPORT_MODES, importMode)) {
    return { isValid: false, errors: errors.length > 0 ? errors : ["Floor plan data is incomplete"] };
  }
  return {
    isValid: true,
    value: {
      importMode,
      addOpenings: parseBooleanField(body.addOpenings, true),
      addSuggestedFurniture: parseBooleanField(body.addSuggestedFurniture, false),
      extraction,
      rooms: removeClientGeneratedIds(roomsJson) as JsonRecord[],
      version: versionNumber,
    },
  };
};

/* ------------------------------------------------------------------ */
/* List query                                                          */
/* ------------------------------------------------------------------ */

export interface StudioListQuery {
  projectId: string | null;
  status: StudioStatus | null;
  searchText: string;
  page: number;
  pageSize: number;
}

export const parseStudioListQuery = (query: unknown): ParseResult<StudioListQuery> => {
  const queryRecord = isRecord(query) ? query : {};
  const errors: string[] = [];
  const projectId = parseOptionalProjectId(queryRecord.projectId);
  if (!projectId.isValid) errors.push(...projectId.errors);
  const status = queryRecord.status;
  if (status !== undefined && status !== "" && !isOneOf(STUDIO_STATUSES, status)) {
    errors.push(`status must be one of: ${STUDIO_STATUSES.join(", ")}`);
  }
  const pageNumber = Number(queryRecord.page ?? 1);
  const pageSize = Number(queryRecord.pageSize ?? 20);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) errors.push("page must be a whole number of 1 or more");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAXIMUM_LIST_PAGE_SIZE) {
    errors.push(`pageSize must be between 1 and ${MAXIMUM_LIST_PAGE_SIZE}`);
  }
  if (errors.length > 0 || !projectId.isValid) return { isValid: false, errors };
  return {
    isValid: true,
    value: {
      projectId: projectId.value,
      status: isOneOf(STUDIO_STATUSES, status) ? status : null,
      searchText: typeof queryRecord.search === "string" ? queryRecord.search.trim().slice(0, 100) : "",
      page: pageNumber,
      pageSize,
    },
  };
};

/** Escapes text for use inside a MongoDB regular expression search. */
export const escapeRegularExpression = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
