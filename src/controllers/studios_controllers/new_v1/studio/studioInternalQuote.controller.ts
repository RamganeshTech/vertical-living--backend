// studioInternalQuote.controller.ts  (NEW FILE)
/**
 * Studio -> internal quote.
 *
 *   GET  /api/studios/:organizationId/:studioId/internal-quote   preview: what would be created. Nothing is saved.
 *   POST /api/studios/:organizationId/:studioId/internal-quote   creates the internal quote and returns it.
 *                                                               Optional body: { "quoteCategory": "residential" | "commercial" }
 *
 * The internal quote model ("MaterialQuoteModel") is used as it is; its file and schema are not changed and not
 * imported here. It is read from mongoose by its registered name, so this file needs no path into that module.
 * The studio itself is only read, never changed.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import StudioModel from "./studio.model";
import { multiRoleAuthMiddleware } from "./studio.crmImports";
import type { IStudio } from "./studio.types";
import { studioToInternalQuote } from "./studioInternalQuote.util";

/** Name the internal quote model is registered with: mongoose.model('MaterialQuoteModel', InternalQuoteSchema). */
const INTERNAL_QUOTE_MODEL_NAME = "MaterialQuoteModel";

const sendSuccess = (response: Response, statusCode: number, message: string, data: unknown): void => {
  response.status(statusCode).json({ ok: true, message, data });
};
const sendError = (response: Response, statusCode: number, message: string, errors?: string[]): void => {
  response.status(statusCode).json(errors && errors.length > 0 ? { ok: false, message, errors } : { ok: false, message });
};
const readParameter = (parameterValue: string | string[] | undefined): string | undefined =>
  Array.isArray(parameterValue) ? parameterValue[0] : parameterValue;

/** The saved studio of this organisation, or null after sending the error response. */
const loadStudio = async (request: Request, response: Response): Promise<IStudio | null> => {
  const organizationId = readParameter(request.params.organizationId);
  const studioId = readParameter(request.params.studioId);
  if (!organizationId || !mongoose.isValidObjectId(organizationId)) {
    sendError(response, 400, "Invalid organization ID");
    return null;
  }
  if (!studioId || !mongoose.isValidObjectId(studioId)) {
    sendError(response, 400, "Invalid studio ID");
    return null;
  }
  const studio = await StudioModel.findOne({ _id: studioId, organizationId }).lean<IStudio>();
  if (!studio) {
    sendError(response, 404, "Studio not found for this organization");
    return null;
  }
  return studio;
};

/**
 * Next internal quote number of the organisation. This is the internal quote module's own getNextQuoteNumber,
 * copied as given (reply of 16 Nov): the highest number after "Q-" among all quotes of the organisation, plus 1.
 * The model is passed in because this file reads it by its registered name instead of importing its file.
 */
const getNextQuoteNumber = async (InternalQuoteEntryModel: mongoose.Model<any>, organizationId: unknown): Promise<string> => {
  const allQuotes: { quoteNo?: string | null }[] = await InternalQuoteEntryModel.find({ organizationId }).select("quoteNo -_id");
  const maxQuoteNumber = allQuotes.reduce((max, quote) => {
    const number = Number(quote.quoteNo?.replace("Q-", ""));
    return !isNaN(number) && number > max ? number : max;
  }, 0);
  const nextNumber = maxQuoteNumber + 1;
  return `Q-${nextNumber}`;
};

/** GET: what the internal quote would hold. Saves nothing. */
export const previewInternalQuoteFromStudio = async (request: Request, response: Response): Promise<void> => {
  try {
    const studio = await loadStudio(request, response);
    if (!studio) return;
    // sendSuccess(response, 200, "Internal quote preview from the studio", studioToInternalQuote(studio));

    ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
    // carpenterDayRate: the rate configuration's carpenter day rate, sent by the button (?carpenterDayRate=...).
    const carpenterDayRate = Number(readParameter(request.query?.carpenterDayRate as string | string[] | undefined)) || 0;
    sendSuccess(response, 200, "Internal quote preview from the studio", studioToInternalQuote(studio, { carpenterDayRate }));
    ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////

  } catch (error) {
    console.error("previewInternalQuoteFromStudio failed", error);
    sendError(response, 500, "Could not prepare the internal quote from this studio");
  }
};

/** POST: creates the internal quote from the saved studio. */
export const createInternalQuoteFromStudio = async (request: Request, response: Response): Promise<void> => {
  try {
    const studio = await loadStudio(request, response);
    if (!studio) return;
    if (!mongoose.modelNames().includes(INTERNAL_QUOTE_MODEL_NAME)) {
      sendError(response, 500, `The internal quote model "${INTERNAL_QUOTE_MODEL_NAME}" is not loaded. Import the internal quote model file once before the studio routes.`);
      return;
    }
    const InternalQuoteModel = mongoose.model(INTERNAL_QUOTE_MODEL_NAME);
    const requestedCategory = typeof request.body?.quoteCategory === "string" ? request.body.quoteCategory.trim() : "";
    const quoteNo = await getNextQuoteNumber(InternalQuoteModel, studio.organizationId);
    // const converted = studioToInternalQuote(studio, { quoteNo, quoteCategory: requestedCategory || null });

     ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
    const carpenterDayRate = Number(request.body?.carpenterDayRate) || 0;
    const converted = studioToInternalQuote(studio, { quoteNo, quoteCategory: requestedCategory || null, carpenterDayRate });
    ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////

    if (converted.quote.furnitures.length === 0) {
      sendError(response, 400, "This studio has no furniture to put in an internal quote", converted.warnings);
      return;
    }
    const createdQuote = await InternalQuoteModel.create(converted.quote);
    sendSuccess(response, 201, `Internal quote ${quoteNo} created from studio ${studio.quoteNo}`, {
      quote: createdQuote,
      warnings: converted.warnings,
      summary: converted.summary,
    });
  } catch (error) {
    console.error("createInternalQuoteFromStudio failed", error);
    if (error instanceof mongoose.Error.ValidationError) {
      sendError(response, 400, "The internal quote could not be saved", Object.entries(error.errors).map(([fieldPath, fieldError]) => `${fieldPath}: ${fieldError.message}`));
      return;
    }
    sendError(response, 500, "Could not create the internal quote from this studio");
  }
};

/** Same roles as the studio editor. Mounted inside the Studio routes (see studio.service.ts). */
const studioInternalQuoteRoles = multiRoleAuthMiddleware("owner", "staff", "CTO");

const StudioInternalQuoteRoutes = Router({ mergeParams: true });
StudioInternalQuoteRoutes.get("/", studioInternalQuoteRoles, previewInternalQuoteFromStudio);
StudioInternalQuoteRoutes.post("/", studioInternalQuoteRoles, createInternalQuoteFromStudio);

export default StudioInternalQuoteRoutes;