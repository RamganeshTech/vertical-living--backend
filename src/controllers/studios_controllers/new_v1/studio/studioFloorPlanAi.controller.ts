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
// import { GoogleGenAI, Type } from "@google/genai";

//////////////////////////////CHANGES STARTED////////////////////////////
import { GoogleGenAI, MediaResolution, Type } from "@google/genai";
///////////////////////////////CHAGNES ENDED////////////////////////////////////
import { jsonrepair } from "jsonrepair";
import { multiRoleAuthMiddleware } from "./studio.crmImports";

const MAXIMUM_IMAGE_BYTES = 30 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MODEL = "gemini-3.8-flash";
const ROOM_KINDS = ["living", "dining", "kitchen", "bedroom", "kidsRoom", "bathroom", "balcony",
   "utility", "pooja", "toilet", "foyer", "study", "lift", "other"];
/** Keys of FURNITURE_CATALOG in the frontend (catalog/furnitureCatalog.ts). Only modular furniture. */
const FURNITURE_TYPES = [
  "wardrobe", "kingBedWithStorage", "queenBedWithStorage", "singleBedWithStorage", "bedsideTable", "dressingUnit",
  "tvUnit", "bookshelf", "crockeryUnit", "poojaUnit", "shoeRack", "seatingBench", "mirrorPanel", "studyTable",
  //////////////////////////////CHANGES STARTED////////////////////////////
  // "sinkUnit", "baseUnit", "drawerUnit", "tallStorageUnit", "wallUnit", "loft", "openWallShelf",
  "sinkUnit", "baseUnit", "drawerUnit", "tallStorageUnit", "wallUnit", "loft", "openWallShelf", "swingUnit",
///////////////////////////////CHAGNES ENDED////////////////////////////////////

];



//////////////////////////////CHANGES STARTED////////////////////////////
/** Door / window / open-passage kinds (OPENING_TYPES in the frontend). openArch = an opening with no shutter (OP, arch, passage). */
const OPENING_KINDS = ["door", "slidingDoor", "window", "ventilator", "openArch"];
///////////////////////////////CHAGNES ENDED////////////////////////////////////


const sendSuccess = (response: Response, statusCode: number, message: string, data: unknown): void => {
  response.status(statusCode).json({ ok: true, message, data });
};
const sendError = (response: Response, statusCode: number, message: string): void => {
  response.status(statusCode).json({ ok: false, message });
};
const readParameter = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

// const PROMPT = `You are reading an architectural 2D floor plan (Indian residential, usually AutoCAD output; it may be messy, scanned, rotated or have overlapping text).
// Return every ROOM / SPACE of the flat and every piece of MODULAR (carpenter-made) FURNITURE drawn or labelled inside the rooms.

// ROOMS
// - name: the room name exactly as written (e.g. "M.BED", "BED ROOM-2", "KITCHEN", "TOILET", "BALCONY"). If a room has no name but is clearly a room, give a short name ("Room").
// - roomKind: one of ${ROOM_KINDS.join(", ")}.
// - sizeText: the room size exactly as written on the plan inside or under the room name (e.g. 12'0" X 14'0", 3600 X 4200, 3.6 X 4.2). Empty string if no size is written for that room. Never invent a size.
// - widthMm / depthMm: the same size in millimetres, width = the horizontal side of the room on the page, depth = the vertical side. Use 0 when no size is written.
// - box_2d: [ymin, xmin, ymax, xmax] of the room's inside (wall to wall), normalised to 0-1000 of the image.
// Do not return stairs, lifts, ducts, shafts, the plot, roads, setbacks, title block, legends or the door/window schedule as rooms.

// FURNITURE (only built-in / modular units a carpenter makes)
// - furnitureType: one of ${FURNITURE_TYPES.join(", ")}.
//   wardrobe = wardrobe / W/R; queenBedWithStorage = bed / double bed (use kingBedWithStorage or singleBedWithStorage when the label or drawn size says so);
//   tvUnit = TV / LCD / TV unit; crockeryUnit = crockery / display / bar unit; baseUnit = kitchen counter / platform / hob;
//   sinkUnit = kitchen sink; wallUnit = kitchen overhead / wall cabinet; studyTable = study / work table or desk; shoeRack = shoe rack.
// - label: the words written for it on the plan, or a short description when it is only drawn (e.g. "bed symbol").
// - roomName: the name of the room it is in, exactly as in the rooms list.
// - point_2d: [y, x] of its centre, normalised to 0-1000 of the image.
// Do not return loose furniture or fittings: sofa, chairs, dining table, fridge, washing machine, WC, wash basin, shower, car.

// Also give lengthUnit: "feetInches", "millimetre", "metre" or "none" (the unit the room sizes are written in), and notes: short warnings (e.g. "text unreadable in the top-right corner").`;


// Also give lengthUnit: "feetInches", "millimetre", "metre" or "none" (the unit the room sizes are written in), and notes: short warnings (e.g. "text unreadable in the top-right corner").`;
//////////////////////////////CHANGES STARTED////////////////////////////
const PROMPT = `You are an expert architectural draughtsman reading a 2D floor plan of an Indian residential flat (usually AutoCAD output; it may be messy, scanned, rotated, have overlapping text, dimension lines, hatching and furniture symbols).
Your answer is used to build a 3D model of the flat, so every wall, door and OPEN PASSAGE between two spaces must be right. A missing opening seals a room off in the 3D model; that is the worst mistake you can make.

HOW TO READ THE DRAWING (do this before answering)
1. Find the walls: thick double lines, usually hatched or filled. Thin single lines are furniture, flooring, dimension lines or text leaders, NOT walls.
2. Walk along every wall of every room and look for every break in it. A break in a wall is ALWAYS an opening of some kind:
   - door: a gap with a swing arc (quarter circle) and a thin leaf line; tags like D, D1, D2, MD (main door), PD (pooja door), VD (ventilator door / toilet door).
   - slidingDoor: a gap with two overlapping thin parallel lines; tags like SD, FD (French door).
   - window: thin parallel lines (3 or 4) inside the wall thickness, no arc; tags like W, W1, W2, KW (kitchen window), FW, LW.
   - ventilator: a small window high in a toilet / kitchen wall; tags like V, V1, KV.
   - openArch: a gap with NO door leaf and NO arc, often shown with DASHED or dotted lines across the gap (the lintel / arch above); tags like OP, OP0, OP1, OP2, OP3, "OPENING", "ARCH", "PASSAGE". Two spaces joined only by dashed lines (for example LIVING and FOYER, DINING and KITCHEN, a passage) are joined by an openArch: return it.
3. Read every tag text near a wall even when it is rotated 90° or written vertically (e.g. "OP0" written top-to-bottom beside a dashed line).
4. A wall shared by two rooms has its opening only once: return it once and list BOTH room names.

ROOMS
- name: the room name exactly as written (e.g. "M.BED", "BED ROOM-2", "KITCHEN", "TOILET", "FOYER", "SIT-OUT", "DRESS", "POOJA", "STORE"). If a space has no name but is clearly a room, give a short name ("Room").
- Return each named space as its own room even when it is open to another one (a FOYER, DINING or PASSAGE separated from the LIVING only by an opening or dashed line is still its own room).
- roomKind: one of ${ROOM_KINDS.join(", ")}.

- sizeText: the room size exactly as written as ONE label inside or under the room name (e.g. 12'0" X 14'0", 3600 X 4200, 3.6 X 4.2). Empty string when there is no such label. Never invent it.
- widthMm / depthMm: the room's inside size in millimetres, width = the horizontal side on the page, depth = the vertical side. Take it from the size label, or, when there is no label, from the room's OWN dimension lines (the figures written along the arrows that run wall to wall inside that room, e.g. 1.50 and 1.35 in metres = 1500 and 1350). Use 0 only when neither is written. Never estimate a size by eye.
- box_2d: [ymin, xmin, ymax, xmax] of the room's inside (inner face of wall to inner face of wall, not the wall centre and not the label), normalised to 0-1000 of the image. Boxes of rooms next to each other must not overlap; an open passage between two rooms belongs to neither box.
- A LIFT / elevator shaft is a room too: roomKind "lift", name as written (e.g. "LIFT"), sizeText/widthMm/depthMm from its label same as any other room, box_2d around its inner walls.
Do not return stairs, ducts, shafts, the plot, roads, setbacks, title block, legends or the door/window schedule as rooms.

OPENINGS (every door, window, ventilator and open passage in the flat)
- code: the tag exactly as written next to it (e.g. "D1", "MD", "W2", "KW", "V", "OP0"). Empty string when it has no tag.
- openingType: one of ${OPENING_KINDS.join(", ")} (rules above; OP / arch / dashed gap = openArch).
- roomNames: the names of the rooms on each side, exactly as in the rooms list (two names for an inside wall, one name for an outside wall).
- point_2d: [y, x] of the CENTRE OF THE GAP in the wall line (not the tag text, not the door arc), normalised to 0-1000 of the image.
- widthMm: the clear width of the gap in millimetres when a dimension is written for it, else 0. Never guess.
Check before answering: every room except a toilet-less store or duct should have at least one door or openArch; the FOYER must connect to the main door (MD) and to the living / dining; if a room has none, look at its walls again for a dashed gap or an OP tag.

FURNITURE (only built-in / modular units a carpenter makes)
- furnitureType: one of ${FURNITURE_TYPES.join(", ")}.
  wardrobe = wardrobe / W/R; queenBedWithStorage = bed / double bed (use kingBedWithStorage or singleBedWithStorage when the label or drawn size says so);
  tvUnit = TV / LCD / TV unit; crockeryUnit = crockery / display / bar unit; baseUnit = kitchen counter / platform / hob;
  sinkUnit = kitchen sink; wallUnit = kitchen overhead / wall cabinet; studyTable = study / work table or desk; shoeRack = shoe rack.
- label: the words written for it on the plan, or a short description when it is only drawn (e.g. "bed symbol").
- roomName: the name of the room it is in, exactly as in the rooms list.
- point_2d: [y, x] of its centre, normalised to 0-1000 of the image.
Do not return loose furniture or fittings: sofa, chairs, dining table, fridge, washing machine, WC, wash basin, shower, car.

Also give lengthUnit: "feetInches", "millimetre", "metre" or "none" (the unit the room sizes are written in), and notes: short warnings (e.g. "text unreadable in the top-right corner", "opening between KITCHEN and UTILITY unclear").`;
///////////////////////////////CHAGNES ENDED////////////////////////////////////


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
    //////////////////////////////CHANGES STARTED////////////////////////////
    openings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          openingType: { type: Type.STRING, enum: OPENING_KINDS },
          roomNames: { type: Type.ARRAY, items: { type: Type.STRING } },
          point_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          widthMm: { type: Type.NUMBER },
        },
        required: ["code", "openingType", "roomNames", "point_2d", "widthMm"],
      },
    },
    ///////////////////////////////CHAGNES ENDED////////////////////////////////////
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
  // required: ["lengthUnit", "rooms", "furniture", "notes"],

  //////////////////////////////CHANGES STARTED////////////////////////////
  // Rooms first, then openings: the model names the rooms before it lists the openings between them.
  required: ["lengthUnit", "rooms", "openings", "furniture", "notes"],
  propertyOrdering: ["lengthUnit", "rooms", "openings", "furniture", "notes"],
  ///////////////////////////////CHAGNES ENDED////////////////////////////////////
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

//////////////////////////////CHANGES STARTED////////////////////////////
export interface AiFloorPlanOpening {
  /** Tag as written ("D1", "OP0"…), upper case; "" when the plan has none. */
  code: string;
  openingType: string;
  /** Rooms on each side (one for an outside wall). */
  roomNames: string[];
  /** [y, x] of the gap centre, 0–1000 of the image; null when not given. */
  point: number[] | null;
  /** Clear width written on the plan, mm; 0 when not written. */
  widthMm: number;
}


export interface AiFloorPlanResult {
  lengthUnit: string;
  rooms: AiFloorPlanRoom[];
  openings: AiFloorPlanOpening[];
  furniture: AiFloorPlanFurniture[];
  ///////////////////////////////CHAGNES ENDED////////////////////////////////////
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
  // return { lengthUnit, rooms, furniture, notes, model };

  //////////////////////////////CHANGES STARTED////////////////////////////
  // Openings: only the ones with a point on the page (it is how they are put on a wall); one per spot.
  const openings: AiFloorPlanOpening[] = [];
  for (const item of (Array.isArray(body.openings) ? body.openings : []).filter(isRecord)) {
    const point = toPageNumbers(item.point_2d, 2);
    if (!point) continue;
    const openingType = OPENING_KINDS.includes(toText(item.openingType, 20)) ? toText(item.openingType, 20) : "door";
    const isDuplicate = openings.some((existing) => existing.point && Math.abs(existing.point[0] - point[0]) < 4 && Math.abs(existing.point[1] - point[1]) < 4);
    if (isDuplicate) continue;
    const widthMm = toNumber(item.widthMm);
    openings.push({
      code: toText(item.code, 12).toUpperCase().replace(/\s+/g, ""),
      openingType,
      roomNames: (Array.isArray(item.roomNames) ? item.roomNames : []).map((name) => toText(name, 120)).filter(Boolean).slice(0, 2),
      point,
      widthMm: widthMm >= 300 && widthMm <= 6000 ? Math.round(widthMm) : 0,
    });
  }
  return { lengthUnit, rooms, openings: openings.slice(0, 200), furniture, notes, model };
  ///////////////////////////////CHAGNES ENDED////////////////////////////////////
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

    const model = DEFAULT_MODEL;
    const ai = new GoogleGenAI({ apiKey });
    // const result = await ai.models.generateContent({
    //   model,
    //   contents: [{ role: "user", parts: [{ inlineData: { mimeType: image.mimetype, data: image.buffer.toString("base64") } }, { text: PROMPT }] }],
    //   config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0 },
    // });

     //////////////////////////////CHANGES STARTED////////////////////////////
    // Same model. The image is read at HIGH media resolution so small tags (D1, OP0, W2) and dashed lines are seen;
    // if the model does not accept that setting, the call is made once more at the default resolution.
    const contents = [{ role: "user", parts: [{ inlineData: { mimeType: image.mimetype, data: image.buffer.toString("base64") } }, { text: PROMPT }] }];
    const baseConfig = { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0 };
    let result;
    try {
      result = await ai.models.generateContent({ model, contents, config: { ...baseConfig, mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH } });
    } catch (highResolutionError) {
      console.warn("readFloorPlanWithAi: high media resolution not accepted, retrying at default", highResolutionError instanceof Error ? highResolutionError.message : highResolutionError);
      result = await ai.models.generateContent({ model, contents, config: baseConfig });
    }
    ///////////////////////////////CHAGNES ENDED////////////////////////////////////


    const text = result.text ?? "";
    if (!text.trim()) return sendError(response, 502, "The AI returned no answer for this plan. Try again, or use Normal extract.");
    const cleaned = cleanAiFloorPlan(parseModelText(text), model);
    // sendSuccess(response, 200, `${cleaned.rooms.length} rooms and ${cleaned.furniture.length} furniture read with AI`, cleaned);
     //////////////////////////////CHANGES STARTED////////////////////////////
    sendSuccess(response, 200, `${cleaned.rooms.length} rooms, ${cleaned.openings.length} doors / windows / openings and ${cleaned.furniture.length} furniture read with AI`, cleaned);
    ///////////////////////////////CHAGNES ENDED////////////////////////////////////
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
