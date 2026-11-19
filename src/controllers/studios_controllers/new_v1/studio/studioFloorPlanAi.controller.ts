////////////////////////////////CHANGES STARTED/////////////////////////////////////////
// studioFloorPlanAi.controller.ts  (NEW FILE)
/**
 * "Extract with AI" for the floor plan import popup.
 *
 *   POST /:organizationId/:studioId/floor-plan-ai     field "image": the plan page as the browser drew it (PNG or JPEG)
 *        body field "pageNumber" (optional, for the log only)
 *   → { ok: true, data: { rooms: [...], furniture: [...], lengthUnit, notes: [...], model } }
 *
 * The browser sends the page it already rendered, so the boxes Gemini returns (0–1000 of the image) line up with the
 * plan on screen. Nothing is saved here: the popup shows the result for review, and "Create rooms" saves as before.
 *
 * Needs GEMINI_API_KEY in the backend .env (GOOGLE_API_KEY is also accepted). 
 * default "gemini-3.8-flash". Mounted in studio.service.ts next to the internal quote route.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import { multiRoleAuthMiddleware } from "./studio.crmImports";

const MAXIMUM_IMAGE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MODEL = "gemini-3.8-flash";
const ROOM_KINDS = ["living", "dining", "kitchen", "bedroom", "kidsRoom", "bathroom", "balcony", "utility", "pooja", "toilet", "foyer", "study", "other"];
/** Keys of FURNITURE_CATALOG in the frontend (catalog/furnitureCatalog.ts). Only modular furniture. */
const FURNITURE_TYPES = [
  "wardrobe", "kingBedWithStorage", "queenBedWithStorage", "singleBedWithStorage", "bedsideTable", "dressingUnit",
  "tvUnit", "bookshelf", "crockeryUnit", "poojaUnit", "shoeRack", "seatingBench", "mirrorPanel", "studyTable",
  "sinkUnit", "baseUnit", "drawerUnit", "tallStorageUnit", "wallUnit", "loft", "openWallShelf",
];

const sendSuccess = (response: Response, statusCode: number, message: string, data: unknown): void => {
  response.status(statusCode).json({ ok: true, message, data });
};
const sendError = (response: Response, statusCode: number, message: string): void => {
  response.status(statusCode).json({ ok: false, message });
};
const readParameter = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const PROMPT = `You are reading an architectural 2D floor plan (Indian residential, usually AutoCAD output; it may be messy, scanned, rotated or have overlapping text).
Return every ROOM / SPACE of the flat and every piece of MODULAR (carpenter-made) FURNITURE drawn or labelled inside the rooms.

ROOMS
- name: the room name exactly as written (e.g. "M.BED", "BED ROOM-2", "KITCHEN", "TOILET", "BALCONY"). If a room has no name but is clearly a room, give a short name ("Room").
- roomKind: one of ${ROOM_KINDS.join(", ")}.
- sizeText: the room size exactly as written on the plan inside or under the room name (e.g. 12'0" X 14'0", 3600 X 4200, 3.6 X 4.2). Empty string if no size is written for that room. Never invent a size.
- widthMm / depthMm: the same size in millimetres, width = the horizontal side of the room on the page, depth = the vertical side. Use 0 when no size is written.
- box_2d: [ymin, xmin, ymax, xmax] of the room's inside (wall to wall), normalised to 0-1000 of the image.
Do not return stairs, lifts, ducts, shafts, the plot, roads, setbacks, title block, legends or the door/window schedule as rooms.

FURNITURE (only built-in / modular units a carpenter makes)
- furnitureType: one of ${FURNITURE_TYPES.join(", ")}.
  wardrobe = wardrobe / W/R; queenBedWithStorage = bed / double bed (use kingBedWithStorage or singleBedWithStorage when the label or drawn size says so);
  tvUnit = TV / LCD / TV unit; crockeryUnit = crockery / display / bar unit; baseUnit = kitchen counter / platform / hob;
  sinkUnit = kitchen sink; wallUnit = kitchen overhead / wall cabinet; studyTable = study / work table or desk; shoeRack = shoe rack.
- label: the words written for it on the plan, or a short description when it is only drawn (e.g. "bed symbol").
- roomName: the name of the room it is in, exactly as in the rooms list.
- point_2d: [y, x] of its centre, normalised to 0-1000 of the image.
Do not return loose furniture or fittings: sofa, chairs, dining table, fridge, washing machine, WC, wash basin, shower, car.

Also give lengthUnit: "feetInches", "millimetre", "metre" or "none" (the unit the room sizes are written in), and notes: short warnings (e.g. "text unreadable in the top-right corner").`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    lengthUnit: { type: Type.STRING, enum: ["feetInches", "millimetre", "metre", "none"] },
    rooms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          roomKind: { type: Type.STRING, enum: ROOM_KINDS },
          sizeText: { type: Type.STRING },
          widthMm: { type: Type.NUMBER },
          depthMm: { type: Type.NUMBER },
          box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        },
        required: ["name", "roomKind", "sizeText", "widthMm", "depthMm", "box_2d"],
      },
    },
    furniture: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          furnitureType: { type: Type.STRING, enum: FURNITURE_TYPES },
          label: { type: Type.STRING },
          roomName: { type: Type.STRING },
          point_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        },
        required: ["furnitureType", "label", "roomName", "point_2d"],
      },
    },
    notes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["lengthUnit", "rooms", "furniture", "notes"],
};

/* ---------------------------- cleaning the answer ---------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const toText = (value: unknown, maximumLength: number): string => (typeof value === "string" ? value.trim().slice(0, maximumLength) : "");
const toNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0);
const toPageNumbers = (value: unknown, count: number): number[] | null => {
  if (!Array.isArray(value) || value.length !== count) return null;
  const numbers = value.map((entry) => Math.min(1000, Math.max(0, toNumber(entry))));
  return numbers;
};

export interface AiFloorPlanRoom {
  name: string;
  roomKind: string;
  sizeText: string;
  widthMm: number;
  depthMm: number;
  /** [ymin, xmin, ymax, xmax], 0–1000 of the image; null when Gemini gave no usable box. */
  box: number[] | null;
}

export interface AiFloorPlanFurniture {
  furnitureType: string;
  label: string;
  roomName: string;
  /** [y, x], 0–1000 of the image; null when not given. */
  point: number[] | null;
}

export interface AiFloorPlanResult {
  lengthUnit: string;
  rooms: AiFloorPlanRoom[];
  furniture: AiFloorPlanFurniture[];
  notes: string[];
  model: string;
}

/** Keeps only well-formed rooms and furniture; sizes outside 0.3–30 m are dropped (set to 0). */
export const cleanAiFloorPlan = (raw: unknown, model: string): AiFloorPlanResult => {
  const body = isRecord(raw) ? raw : {};
  const rooms: AiFloorPlanRoom[] = (Array.isArray(body.rooms) ? body.rooms : []).filter(isRecord).map((room) => {
    let box = toPageNumbers(room.box_2d, 4);
    if (box && (box[2] <= box[0] || box[3] <= box[1])) box = null;
    const sizeOk = (value: number) => value >= 300 && value <= 30000;
    const widthMm = toNumber(room.widthMm);
    const depthMm = toNumber(room.depthMm);
    return {
      name: toText(room.name, 120) || "Room",
      roomKind: ROOM_KINDS.includes(toText(room.roomKind, 20)) ? toText(room.roomKind, 20) : "other",
      sizeText: toText(room.sizeText, 60),
      widthMm: sizeOk(widthMm) && sizeOk(depthMm) ? Math.round(widthMm) : 0,
      depthMm: sizeOk(widthMm) && sizeOk(depthMm) ? Math.round(depthMm) : 0,
      box,
    };
  });
  const furniture: AiFloorPlanFurniture[] = (Array.isArray(body.furniture) ? body.furniture : []).filter(isRecord)
    .map((item) => ({
      furnitureType: toText(item.furnitureType, 40),
      label: toText(item.label, 60),
      roomName: toText(item.roomName, 120),
      point: toPageNumbers(item.point_2d, 2),
    }))
    .filter((item) => FURNITURE_TYPES.includes(item.furnitureType));
  const lengthUnit = ["feetInches", "millimetre", "metre", "none"].includes(toText(body.lengthUnit, 20)) ? toText(body.lengthUnit, 20) : "none";
  const notes = (Array.isArray(body.notes) ? body.notes : []).map((note) => toText(note, 200)).filter(Boolean).slice(0, 10);
  return { lengthUnit, rooms, furniture, notes, model };
};

/** Gemini's text → JSON. Uses jsonrepair for a cut or slightly broken answer. */
const parseModelText = (text: string): unknown => {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return JSON.parse(jsonrepair(trimmed));
  }
};

/* ---------------------------------- route ---------------------------------- */

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMUM_IMAGE_BYTES, files: 1 },
});

export const readFloorPlanWithAi = async (request: Request, response: Response): Promise<void> => {
  try {
    const organizationId = readParameter(request.params.organizationId);
    const studioId = readParameter(request.params.studioId);
    if (!organizationId || !mongoose.isValidObjectId(organizationId)) return sendError(response, 400, "Invalid organization ID");
    if (!studioId || !mongoose.isValidObjectId(studioId)) return sendError(response, 400, "Invalid studio ID");
    const image = request.file;
    if (!image || !image.buffer?.length) return sendError(response, 400, "No plan image provided (field \"image\")");
    if (!ACCEPTED_IMAGE_TYPES.includes(image.mimetype)) return sendError(response, 400, "The plan image must be PNG, JPEG or WebP");
    const apiKey = process.env.GEMINI_API_KEY 
    if (!apiKey) return sendError(response, 503, "AI extraction is not set up: add GEMINI_API_KEY to the backend .env");

    const model =  DEFAULT_MODEL;
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: image.mimetype, data: image.buffer.toString("base64") } }, { text: PROMPT }] }],
      config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0 },
    });
    const text = result.text ?? "";
    if (!text.trim()) return sendError(response, 502, "The AI returned no answer for this plan. Try again, or use Normal extract.");
    const cleaned = cleanAiFloorPlan(parseModelText(text), model);
    sendSuccess(response, 200, `${cleaned.rooms.length} rooms and ${cleaned.furniture.length} furniture read with AI`, cleaned);
  } catch (error) {
    console.error("readFloorPlanWithAi", error);
    sendError(response, 502, `AI extraction failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
};

/** Multer errors (file too large…) as a normal JSON error instead of the default HTML page. */
const acceptPlanImage = (request: Request, response: Response, next: (error?: unknown) => void): void => {
  imageUpload.single("image")(request, response, (uploadError: unknown) => {
    if (uploadError) {
      const message = uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE" ? "The plan image is larger than 15 MB" : "Could not read the plan image";
      sendError(response, 400, message);
      return;
    }
    next();
  });
};

const floorPlanAiRoles = multiRoleAuthMiddleware("owner", "staff", "CTO");

const StudioFloorPlanAiRoutes = Router({ mergeParams: true });
StudioFloorPlanAiRoutes.post("/", floorPlanAiRoles, acceptPlanImage, readFloorPlanWithAi);

export default StudioFloorPlanAiRoutes;
///////////////////////////////CHANGES ENDED////////////////////////////////////////////////
