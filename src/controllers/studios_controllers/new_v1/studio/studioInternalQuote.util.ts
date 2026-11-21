


// studioInternalQuote.util.ts  (NEW FILE)
/**
 * Turns a saved 3D studio into the shape of the internal quote model ("MaterialQuoteModel").
 *
 * Pure functions only: no database, no Express. The internal quote model and its schema are NOT changed;
 * everything here only reads the studio and fills the internal quote's existing fields.
 *
 * One furniture item of the studio  ->  one "modular" entry of internalQuote.furnitures[]:
 *   coreMaterials[0]           carcass + shutter boards (plywood sheets), inner and outer laminate sheets,
 *                              and the carpenters and days of the WHOLE furniture
 *   coreMaterials[1]           back panel plywood sheets (its own thickness, one row per thickness); carpenters 0, days 0.
 *                              Labour and fabrication are split evenly across the core rows, as the pages do.
 *   fittingsAndAccessories[]   hinges, handles, drawer channels, hanging rod + every accessory of the unit
 *   nonBrandMaterials[]        worktop, glass / mirror, plinth, upholstered headboard
 *   glues[]                    empty (the studio does not calculate glue yet)
 *
 * Everything that does not belong to a furniture  ->  internalQuote.commonMaterials[] (same row shape as
 * fittings and accessories): the wall, floor, ceiling, door, window, light, electrical point and decor
 * materials, one row per room and finish, and the labour of the other trades (painters, tile masons, ceiling
 * fixers ...), one row per trade. works[] and glues[] are never filled.
 *
 * Row totals follow the internal quote's own formulas (replies of 16 Nov):
 *   core row      = (material of the row + labour / rows + fabrication / rows) × (1 + furnitureProfit / 100)
 *   simple row    = quantity × cost × (1 + profit / 100)      profit = the row's profitOnMaterial, else the furniture's
 *   common row    = quantity × cost + (sum of every common row's quantity × cost × commonProfitOverride %) / rows
 *                   -> the profit of the whole common pool, split evenly: every row gets the same flat amount.
 *                   commonProfitOverride = the studio margin % (the global profit %).
 *   furniture     = core + fittings + glues + non-brand
 * Labour is read from the furniture's "labour" object (labourCost only for studios saved before it existed).
 * Margin is on material AND labour, the same as the studio.
 *
 * Every figure that is an assumption (not something the studio stores) is in STUDIO_QUOTE_ASSUMPTIONS below,
 * in one place, so it can be corrected without touching the logic.
 */
import type { FurnitureItem, IStudio, PriceBreakdownLine, Room } from "./studio.types";
import type { StudioMasterMaterials } from "./studio.types";

import { furnitureLabourCostOf } from "./studio.pricing";
import { SHEET_AREA_SQFT } from "./studio.constants";
import { IMaterial } from "../../../../models/Quote Model/QuoteGenerate Model/InternalQuote.model";

/* ------------------------------------------------------------------ */
/* Assumptions: check these with the site team                         */
/* ------------------------------------------------------------------ */


////////////////////////////////CHANGES STARTED/////////////////////////////////////////
/** "[Studio boards ₹3797.01]": the studio board amount (before profit) at the start of a core row's remarks. */
export const STUDIO_BOARDS_TAG_START = "[Studio boards ₹";
export const STUDIO_BOARDS_TAG_END = "]";
///////////////////////////////CHANGES ENDED////////////////////////////////////////////////


export const STUDIO_QUOTE_ASSUMPTIONS = {
  /** Used only when the studio line has no thickness (no CRM plywood chosen). Taken from internal quote Q-53. */
  defaultCarcassThickness: 16,
  defaultBackPanelThickness: 12,
  defaultLaminateThickness: 0.8,
  /** Inner laminate = this many faces of every board (carcass + shutter). Q-53 shows about one sheet per plywood sheet. */
  innerLaminateFacesPerBoard: 1,
  /** Shutters bought ready (no plywood, no laminate). Every other shutter finish is a sheet on a board: plywood + outer laminate. */
  readyMadeShutterRateKeys: ["shutter.glass", "shutter.lacqueredGlass"],
  /**
   * false: days = exact man-days / carpenters (2 decimals), so carpenters × days adds up to the Labour Engine's
   *        man-days. true: each furniture's days are rounded up to half a day (the site schedule figure); over a
   *        whole home this adds about 40% more carpenter-days than the engine calculated.
   */
  roundDaysUpToHalfDay: false,
  /** Group names written in the description of each common material row. */
  // commonGroupNames: { walls: "Wall finishes", floor: "Flooring", ceiling: "False ceiling", openings: "Doors and windows", lighting: "Lighting", electrical: "Electrical points", decor: "Decor", labour: "Site labour" },
  commonGroupNames: { walls: "Wall finishes", floor: "Flooring", ceiling: "False ceiling", openings: "Doors and windows", lighting: "Lighting", electrical: "Electrical points", decor: "Decor", labour: "Site labour", additionalCharges: "Additional charges" },
  /**
   * true (reply of 16 Nov, third revision): the global profit % is applied to the common materials too. It is
   *       saved as commonProfitOverride; the profit of the whole pool is split evenly across the rows.
   *       NOTE: the studio adds margin on labour but NOT on wall, floor, ceiling, door, window, light,
   *       electrical and decor materials, so the internal quote is higher than the studio by the profit on
   *       those materials (summary.commonMaterialProfitNotInStudio).
   * false: no pool profit; material rows carry no profit and labour rows carry the studio margin as their own
   *       profitOnMaterial, so the internal quote total equals the studio total.
   */
  applyGlobalProfitToCommonMaterials: true,
  /**
   * true: the labour of the other trades (painters, tile masons, ceiling fixers, electricians ...) is added to
   * commonMaterials, one row per trade (quantity = man-days, cost = rate per man-day). false: it is left out,
   * and the internal quote total is lower than the studio total by that labour.
   */
  includeSiteLabourInCommonMaterials: true,
  // No carpenter rate is written here. The rate comes from the Labour Engine (saved on each furniture's labour)
  // and from the labour rate configuration (sent by the "Convert to internal quote" button). See furnitureToInternalQuote.
  /** The internal quote's default type and category for a quote created from a studio. */
  quoteType: "basic",
  defaultQuoteCategory: "residential",
} as const;

/* ------------------------------------------------------------------ */
/* Internal quote shapes (copied from the internal quote model; that file is not imported or changed) */
/* ------------------------------------------------------------------ */

interface QuantityAndThickness { quantity: number | null; thickness: number | null }

export interface InternalQuoteCoreMaterial extends IMaterial {
  // itemName: string | null;
  // imageUrl: string | null;
  // plywoodNos: QuantityAndThickness;
  // laminateNos: QuantityAndThickness;
  // innerLaminate: QuantityAndThickness;
  // outerLaminate: QuantityAndThickness;
  // carpenters: number;
  // days: number;
  // profitOnMaterial: number;
  // profitOnLabour: number;
  // rowTotal: number;
  // remarks: string | null;
  ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
  /**
   * NEW FIELD (one line to add in the internal quote model, see README): the studio's board and laminate amount
   * for this row, before profit. While the sheets, thicknesses and brands are the ones the studio chose, the
   * internal quote page and the quote variant page use this amount instead of sheets × rate.
   * null (or missing, as in every quote typed by hand) = price from sheets × rate, exactly as before.
   */
  studioMaterialCost?: number | null;
  ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////
}

export interface InternalQuoteSimpleItem {
  itemName: string | null;
  description: string | null;
  brandId: unknown | null;
  brandName: string | null;
  imageUrl: string | null;
  quantity: number;
  profitOnMaterial: number;
  cost: number;
  rowTotal: number;
}

export interface InternalQuoteFurniture {
  furnitureName: string;
  dimention: { height: number | null; width: number | null; depth: number | null };
  furnitureProfit: number;
  fabricationCost: number;
  coreMaterials: InternalQuoteCoreMaterial[];
  fittingsAndAccessories: InternalQuoteSimpleItem[];
  glues: InternalQuoteSimpleItem[];
  nonBrandMaterials: InternalQuoteSimpleItem[];
  coreMaterialsTotal: number;
  fittingsAndAccessoriesTotal: number;
  gluesTotal: number;
  nonBrandMaterialsTotal: number;
  furnitureTotal: number;
  plywoodBrandId: unknown | null;
  innerLaminateBrandId: unknown | null;
  outerLaminateBrandId: unknown | null;
  typeOfWork: "modular" | "non-modular";
  typeOfNonModularWork: string | null;
  works: never[]; // never filled from a studio
}

export interface InternalQuoteFromStudio {
  quoteNo: string | null;
  quoteType: string;
  organizationId: unknown;
  projectId: unknown | null;
  mainQuoteName: string | null;
  quoteCategory: string | null;
  plywoodBrandId: unknown | null;
  innerLaminateId: unknown | null;
  outerLaminateId: unknown | null;
  sqftRateWork: never[];
  furnitures: InternalQuoteFurniture[];
  commonMaterials: InternalQuoteSimpleItem[];
  commonProfitOverride: number;
  globalTransportation: number;
  globalProfitPercent: number;
  mainQuote: null;
  grandTotal: number;
  notes: string;
  isProductSpecific: boolean;
  ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
  /** true = made from the 3D studio (field "fromInternalQuote" in the internal quote model). Typed quotes keep false. */
  fromInternalQuote: boolean;
    gstPercent: number;

  ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////

}

export interface StudioToInternalQuoteResult {
  quote: InternalQuoteFromStudio;
  /** Things the person should know: missing rates, assumed thickness, units with no labour detail, what was left out. */
  warnings: string[];
  summary: {
    furnitureCount: number;
    plywoodSheets: number;
    laminateSheets: number;
    carpenterDays: number;
    /** Labour before margin: furniture labour, and the labour of the other trades. */
    furnitureLabourCost: number;
    otherLabourCost: number;
    /** furnitureTotal includes the furniture profit. Walls to site labour are the commonMaterials rows BEFORE profit (quantity × cost). */
    furnitureTotal: number;
    wallsTotal: number;
    floorTotal: number;
    ceilingTotal: number;
    openingsTotal: number;
    lightingTotal: number;
    electricalTotal: number;
    decorTotal: number;
    siteLabourTotal: number;
    /** Profit added on the common materials rows, on top of the totals above. */
    commonProfitPercentage: number;
    commonProfitAmount: number;
    grandTotal: number;
        gstPercent: number;
    gstAmount: number;
    grandTotalWithGst: number;
    /**
     * Check against the studio (its total before adjustment and GST).
     * differenceFromStudio = internal quote - studio. commonMaterialProfitNotInStudio is the part of it that is
     * expected: profit on common MATERIALS, which the studio does not add. The rest is rupee rounding.
     */
    studioSubtotal: number;
    commonMaterialProfitNotInStudio: number;
    differenceFromStudio: number;
  };
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundTwo = (value: number): number => Math.round(toNumber(value) * 100) / 100;
const sheetsFor = (squareFeet: number): number => (squareFeet > 0 ? Math.ceil(squareFeet / SHEET_AREA_SQFT - 1e-9) : 0);

/** "tvUnit" -> "Tv unit", "queenBedWithStorage" -> "Queen bed with storage". */
const readableName = (camelCaseName: string): string => {
  const words = String(camelCaseName ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Furniture";
};

const UNIT_WORDS: Record<string, string> = { squareFoot: "sq ft", runningFoot: "running ft", piece: "nos", pair: "pairs", set: "sets", sheet: "sheets", pack: "packs", litre: "litres", lumpSum: "lump sum" };

const isBoardBackedShutter = (rateKey: string): boolean =>
  rateKey.startsWith("shutter.") && !(STUDIO_QUOTE_ASSUMPTIONS.readyMadeShutterRateKeys as readonly string[]).includes(rateKey);

const isFittingRateKey = (rateKey: string): boolean =>
  rateKey === "hinge" || rateKey === "drawerChannel" || rateKey === "hangingRod" || rateKey.startsWith("handle.");

const simpleItem = (itemName: string, description: string | null, brandId: unknown | null, brandName: string, quantity: number, cost: number, profitPercentage: number): InternalQuoteSimpleItem => ({
  itemName,
  description,
  brandId: brandId ?? null,
  brandName: brandName || null,
  imageUrl: null,
  quantity: roundTwo(quantity),
  profitOnMaterial: 0,
  cost: roundTwo(cost),
  // Same working as the internal quote: quantity × cost, plus the furniture profit %.
  rowTotal: roundTwo(quantity * cost * (1 + profitPercentage / 100)),
});

const lineAsSimpleItem = (line: PriceBreakdownLine, profitPercentage: number): InternalQuoteSimpleItem =>
  simpleItem(line.label, UNIT_WORDS[line.unit] ?? line.unit ?? null, line.rateConfigurationItemId, line.rateConfigurationItemName, toNumber(line.quantity), toNumber(line.unitPrice), profitPercentage);

/** Days of the furniture's crew for the internal quote (see roundDaysUpToHalfDay). */
const daysForQuote = (labour: { days: number; manDays: number; labourCount: number; skilledHours: number; hoursPerDay: number }): number =>
  // Exact man-days (skilled hours / hours per day), 4 decimals: carpenters × days must give back the studio's labour.
  STUDIO_QUOTE_ASSUMPTIONS.roundDaysUpToHalfDay
    ? toNumber(labour.days)
    : Math.round((toNumber(labour.skilledHours) / Math.max(1, toNumber(labour.hoursPerDay) || 7) / Math.max(1, toNumber(labour.labourCount))) * 10000) / 10000;
// STUDIO_QUOTE_ASSUMPTIONS.roundDaysUpToHalfDay ? toNumber(labour.days) : roundTwo(toNumber(labour.manDays) / Math.max(1, toNumber(labour.labourCount)));

// const sumRowTotals = (rows: ReadonlyArray<{ rowTotal: number }>): number => Math.round(rows.reduce((sum, row) => sum + toNumber(row.rowTotal), 0));

const sumRowTotals = (rows: ReadonlyArray<{ rowTotal?: number }>): number =>
  Math.round(rows.reduce((sum, row) => sum + toNumber(row.rowTotal), 0));

/* ------------------------------------------------------------------ */
/* One furniture item                                                  */
/* ------------------------------------------------------------------ */


///////////////////CHAGNES STARTED//////////////////////////////////
/**
 * The studio's own whole sheets of one furniture (from its cut list, saved as sheetsRequired on the price lines):
 * carcass (shutter boards of in-house shutters included), back panel and laminate. null for studios saved before.
 */
const studioSheetsOf = (lines: ReadonlyArray<PriceBreakdownLine>): { carcassSheets: number; backPanelSheets: number; laminateSheets: number } | null => {
  const carcassLines = lines.filter((line) => line.rateKey.startsWith("carcass."));
  if (carcassLines.length === 0 || carcassLines.some((line) => line.sheetsRequired == null)) return null;
  const sheetsOfLines = (picked: ReadonlyArray<PriceBreakdownLine>) => picked.reduce((sum, line) => sum + toNumber(line.sheetsRequired ?? sheetsFor(toNumber(line.quantity))), 0);
  return {
    carcassSheets: sheetsOfLines(carcassLines),
    backPanelSheets: sheetsOfLines(lines.filter((line) => line.rateKey === "backPanel")),
    laminateSheets: sheetsOfLines(lines.filter((line) => isBoardBackedShutter(line.rateKey) && line.sheetsRequired != null)),
  };
};

/////////////////////CHAGNES ENDED///////////////////////////////////

/** Plywood and laminate sheets of the whole studio, the same way each furniture counts them (rounded up per furniture). */
const sheetCountOf = (rooms: ReadonlyArray<Room>): { plywood: number; laminate: number } => {
  let plywood = 0;
  let laminate = 0;
  for (const room of rooms) {
    for (const item of room.furniture ?? []) {
      const lines = item.priceBreakdown ?? [];
      const carcass = lines.filter((line) => line.rateKey.startsWith("carcass.")).reduce((sum, line) => sum + toNumber(line.quantity), 0);
      const shutters = lines.filter((line) => isBoardBackedShutter(line.rateKey)).reduce((sum, line) => sum + toNumber(line.quantity), 0);
      ///////////////////CHAGNES STARTED//////////////////////////////////
      // plywood += sheetsFor(carcass + shutters);
      // laminate += sheetsFor((carcass + shutters) * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard) + sheetsFor(shutters);
      // Studio sheets (cut list, per furniture) when saved; the sq ft way for studios saved before.
      const counts = studioSheetsOf(lines);
      if (counts) {
        plywood += counts.carcassSheets + counts.backPanelSheets;
        laminate += counts.carcassSheets * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard + counts.laminateSheets;
      } else {
        plywood += sheetsFor(carcass + shutters);
        laminate += sheetsFor((carcass + shutters) * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard) + sheetsFor(shutters);
      }
      /////////////////////CHAGNES ENDED///////////////////////////////////
    }
  }
  return { plywood, laminate };
};

// export const furnitureToInternalQuote = (item: FurnitureItem, room: Room, marginPercentage: number, labourFactor: number, warnings: string[]): InternalQuoteFurniture => {
/**
 * pageCarpenterDayRate: the carpenter day rate the internal quote and quote variant pages use (labour rate
 * configuration, category "plywood"), sent by the "Convert to internal quote" button; 0 when not sent.
 * master: the whole-home plywood / laminates of the studio (null when not chosen).
 */
export const furnitureToInternalQuote = (item: FurnitureItem, room: Room, marginPercentage: number, labourFactor: number, warnings: string[], pageCarpenterDayRate = 0, master: StudioMasterMaterials | null = null): InternalQuoteFurniture => {

  const furnitureName = `${room.name || "Room"} ${readableName(item.furnitureType)}${item.code ? ` (${item.code})` : ""}`;
  // The studio adds no margin on a catalogue product (bought ready), so its profit is 0 here too.
  const profitPercentage = item.pricingMethod === "rateConfigurationItem" ? 0 : marginPercentage;
  const profitFactor = 1 + profitPercentage / 100;
  const lines = item.priceBreakdown ?? [];

  const carcassLines = lines.filter((line) => line.rateKey.startsWith("carcass."));
  // const backPanelLines = lines.filter((line) => line.rateKey === "backPanel");
  const shutterBoardLines = lines.filter((line) => isBoardBackedShutter(line.rateKey));
  const fittingLines = lines.filter((line) => isFittingRateKey(line.rateKey));
  // const otherLines = lines.filter((line) => !carcassLines.includes(line) && !backPanelLines.includes(line) && !shutterBoardLines.includes(line) && !fittingLines.includes(line));
  ///////////////////CHAGNES STARTED//////////////////////////////////
  // const otherLines = lines.filter((line) => !carcassLines.includes(line)  && !shutterBoardLines.includes(line) && !fittingLines.includes(line));
  // Back panel: its own row in sheets (below), not an "other" sq ft row.
  const backPanelLines = lines.filter((line) => line.rateKey === "backPanel");
  const otherLines = lines.filter((line) => !carcassLines.includes(line) && !backPanelLines.includes(line) && !shutterBoardLines.includes(line) && !fittingLines.includes(line));
  const studioSheets = studioSheetsOf(lines);
  /////////////////////CHAGNES ENDED///////////////////////////////////

  const carcassSquareFeet = carcassLines.reduce((sum, line) => sum + toNumber(line.quantity), 0);
  const shutterSquareFeet = shutterBoardLines.reduce((sum, line) => sum + toNumber(line.quantity), 0);
  // const backPanelSquareFeet = backPanelLines.reduce((sum, line) => sum + toNumber(line.quantity), 0);

  // Plywood: carcass boards + the boards behind laminate / acrylic shutters, in whole 8 × 4 ft sheets (32 sq ft).
  ///////////////////CHAGNES STARTED//////////////////////////////////
  // const boardSquareFeet = carcassSquareFeet + shutterSquareFeet;
  // const plywoodSheets = sheetsFor(boardSquareFeet);
  // const innerLaminateSheets = sheetsFor(boardSquareFeet * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard);
  // const outerLaminateSheets = sheetsFor(shutterSquareFeet);
  // The studio's whole sheets of this furniture (cut list) when saved, so the internal quote shows the same pieces.
  const boardSquareFeet = studioSheets ? studioSheets.carcassSheets * SHEET_AREA_SQFT : carcassSquareFeet + shutterSquareFeet;
  const plywoodSheets = studioSheets ? studioSheets.carcassSheets : sheetsFor(boardSquareFeet);
  const innerLaminateSheets = studioSheets ? studioSheets.carcassSheets * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard : sheetsFor(boardSquareFeet * STUDIO_QUOTE_ASSUMPTIONS.innerLaminateFacesPerBoard);
  const outerLaminateSheets = studioSheets && studioSheets.laminateSheets > 0 ? studioSheets.laminateSheets : sheetsFor(shutterSquareFeet);
  // Factory fabrication of the furniture (studio): the internal quote page adds it to the core row before profit.
  const fabricationCost = roundTwo(toNumber(item.fabricationCost));
  /////////////////////CHAGNES ENDED///////////////////////////////////

  // const backPanelSheets = sheetsFor(backPanelSquareFeet);

  const carcassThickness = toNumber(carcassLines[0]?.thickness) || toNumber(room.furnitureMaterials?.carcassBoard?.thickness);
  // const backPanelThickness = toNumber(backPanelLines[0]?.thickness) || toNumber(room.furnitureMaterials?.backPanel?.thickness);
  const laminateThickness = toNumber(shutterBoardLines[0]?.thickness);
  if (plywoodSheets > 0 && !carcassThickness) warnings.push(`${furnitureName}: no plywood thickness chosen in the studio; ${STUDIO_QUOTE_ASSUMPTIONS.defaultCarcassThickness} mm assumed.`);

  ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
  // HOW THE BOARDS ARE PRICED (third round): the sheets and brands are in the core row, where staff expect
  // them, and the studio's board amount goes with them in studioMaterialCost. The internal quote page and the
  // quote variant page use that amount while the sheets, thicknesses and brands are unchanged, so they show the
  // studio's price. Once someone changes a sheet quantity, a thickness or a brand, the row is priced from
  // sheets × rate, as for a quote typed by hand. Quotes typed by hand have no studioMaterialCost: nothing changes.
  //   core row               plywood, inner and outer laminate sheets + thickness; carpenters, days; studioMaterialCost
  //   nonBrandMaterials[]    worktop, glass, plinth ... + "Helper for carpentry" (helper man-days × helper rate)
  ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////
  //   profitOnLabour         0, unless the studio's carpenter labour is not carpenters × days × the page's rate
  //                          (another hub rate, extended shift, hub labour %): then the difference, in %.
  // Labour of the whole furniture goes in the FIRST core material row, the way the internal quote is typed.
  const labour = item.labour ?? null;
  // Labour is read from the labour object; hub labour % (if any) is applied here because the studio applies it on the total.
  const labourCost = roundTwo(furnitureLabourCostOf(item) * labourFactor);
  const helperCost = labour ? roundTwo(toNumber(labour.helperCost) * labourFactor) : 0;
  const carpenterCost = roundTwo(labourCost - helperCost);
  const carpenters = labour ? Math.max(1, toNumber(labour.labourCount)) : 0;
  // Carpenter day rate of the Labour Engine for this furniture (saved with its labour). Studios saved before the
  // rate was stored: skilled cost ÷ man-days. Nothing is hard-coded.
  const skilledManDays = labour ? toNumber(labour.skilledHours) / Math.max(1, toNumber(labour.hoursPerDay) || 7) : 0;
  const impliedDayRate = skilledManDays > 0 && labour ? toNumber(labour.skilledCost) / skilledManDays : 0;
  // Saved hours are rounded to 2 decimals, so the implied rate is a little off: when it is within 1% of the rate
  // configuration's, that rate is the one the Labour Engine used.
  const engineDayRate = labour
    ? (toNumber(labour.dayRate) || (pageCarpenterDayRate > 0 && Math.abs(impliedDayRate / pageCarpenterDayRate - 1) < 0.01 ? pageCarpenterDayRate : impliedDayRate))
    : 0;
  // Days = carpenter man-days ÷ carpenters, from the cost so it is exact: skilled cost ÷ (carpenters × day rate).
  const days = labour && engineDayRate > 0 && !STUDIO_QUOTE_ASSUMPTIONS.roundDaysUpToHalfDay
    ? Math.round((toNumber(labour.skilledCost) / (carpenters * engineDayRate)) * 10000) / 10000
    : labour ? daysForQuote(labour) : 0;
  // The pages work out carpenters × days × THEIR rate (rate configuration). If that rate is not the Labour
  // Engine's, or a hub labour % applies, the difference goes in profitOnLabour so the pages reach the studio's labour.
  const pageDayRate = pageCarpenterDayRate > 0 ? pageCarpenterDayRate : engineDayRate;
  const pageCarpenterLabour = carpenters * days * pageDayRate;
  const labourAdjustmentPercentage = labour && pageCarpenterLabour > 0 ? Math.round((carpenterCost / pageCarpenterLabour - 1) * 1000000) / 10000 : 0;
  // Below 0.05% (about ₹1 on ₹2,000) it is only rounding, not a real difference.
  const profitOnLabour = Math.abs(labourAdjustmentPercentage) < 0.05 ? 0 : labourAdjustmentPercentage;
  const coreLabour = labour ? pageCarpenterLabour * (1 + profitOnLabour / 100) : 0;
  if (!labour && labourCost > 0) warnings.push(`${furnitureName}: saved before labour details were stored; its labour is one "Carpentry labour" row and carpenters and days are 0. Open the studio and save it once to fill them.`);
  if (profitOnLabour !== 0) warnings.push(`${furnitureName}: the studio's carpenter labour is not carpenters × days × the rate configuration's ₹${roundTwo(pageDayRate)} a day (Labour Engine: ₹${roundTwo(engineDayRate)}${labourFactor !== 1 ? `, hub labour ${roundTwo((labourFactor - 1) * 100)}%` : ""}), so the difference (${profitOnLabour}%) is in "profit on labour".`);

  const boardMaterialCost = [...carcassLines, ...shutterBoardLines].reduce((sum, line) => sum + toNumber(line.totalPrice), 0);
  if (plywoodSheets > 0 && boardMaterialCost <= 0) warnings.push(`${furnitureName}: board and laminate rates are 0 in the studio, so the material amount is 0.`);

  ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
  // One core row holds the boards (sheets, thickness, studio amount) and the carpenters and days of the furniture.
  const hasMainRow = plywoodSheets > 0 || (labour !== null && carpenterCost > 0);
  const coreMaterials: InternalQuoteCoreMaterial[] = [];
  if (hasMainRow) {
    const studioMaterialCost = roundTwo(boardMaterialCost);
    coreMaterials.push({
      // itemName: furnitureName,
      itemName: "Plywood",

      imageUrl: null,
      plywoodNos: { quantity: plywoodSheets, thickness: carcassThickness || STUDIO_QUOTE_ASSUMPTIONS.defaultCarcassThickness },
      laminateNos: { quantity: innerLaminateSheets + outerLaminateSheets, thickness: laminateThickness || STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      innerLaminate: { quantity: innerLaminateSheets, thickness: STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      outerLaminate: { quantity: outerLaminateSheets, thickness: laminateThickness || STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      carpenters,
      days,
      profitOnMaterial: 0,
      profitOnLabour,
      studioMaterialCost,
      // Same as the pages: (studio board amount + carpenters × days × rate × (1 + profitOnLabour %)) × (1 + furniture profit %)

      ///////////////////CHAGNES STARTED//////////////////////////////////
      // rowTotal: roundTwo((studioMaterialCost + coreLabour) * profitFactor),
      // rowTotal: roundTwo((studioMaterialCost + coreLabour + fabricationCost) * profitFactor),
      /////////////////////CHAGNES ENDED///////////////////////////////////

      ////////////////////////CHAGNES STARTED/////////////////////
      // Worked out below, once the back panel row is added: labour and fabrication are split across ALL core rows.
      rowTotal: 0,
      //////////////////////////CHAGNES ENDED///////////////////////////

      ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
      // The model keeps only the fields it has, so the studio board amount also goes at the start of the remarks,
      // as "[Studio boards ₹3797.01]". The pages read it there when the quote has fromInternalQuote = true.
      // Keep this exact text: it is read back by studioBoardAmountOf() in FurnitureForm.tsx.
      remarks: `${STUDIO_BOARDS_TAG_START}${studioMaterialCost}${STUDIO_BOARDS_TAG_END} From 3D studio: boards ${roundTwo(boardSquareFeet)} sq ft = ${plywoodSheets} plywood, ${innerLaminateSheets} inner and ${outerLaminateSheets} outer laminate sheets, ₹${studioMaterialCost} at the studio's rates; `
        + (labour
          ? `carpenters ₹${roundTwo(carpenterCost)}, helpers ₹${roundTwo(helperCost)} (${labour.skilledHours} skilled h + ${labour.helperHours} helper h = ${labour.manDays} carpenter man-days, ${labour.days} days on site for ${labour.labourCount} carpenters, ${labour.route ?? "site"} made)`
          : "no labour details saved"),

    });
  }

  ////////////////////////CHAGNES STARTED/////////////////////
  // BACK PANEL = PLYWOOD, so it is its own core material row (not a non-brand row), one row per thickness:
  //   plywoodNos     back panel sheets (studio cut list) + back panel thickness
  //   laminates      0 (the studio puts no laminate on the back panel)
  //   carpenters 0, days 0   the furniture's labour stays in the first row (the pages read it from row 0 only)
  //   studioMaterialCost     the studio's back panel amount, and the same "[Studio boards ₹…]" remarks tag, so the
  //                          pages price it at the studio's amount until its sheets, thickness or brands change.
  const backPanelByThickness = new Map<number, { sheets: number; squareFeet: number; amount: number }>();
  for (const line of backPanelLines) {
    if (toNumber(line.quantity) <= 0) continue;
    const thickness = toNumber(line.thickness) || toNumber(room.furnitureMaterials?.backPanel?.thickness) || STUDIO_QUOTE_ASSUMPTIONS.defaultBackPanelThickness;
    const group = backPanelByThickness.get(thickness) ?? { sheets: 0, squareFeet: 0, amount: 0 };
    group.sheets += toNumber(line.sheetsRequired) || sheetsFor(toNumber(line.quantity));
    group.squareFeet += toNumber(line.quantity);
    group.amount += toNumber(line.totalPrice);
    backPanelByThickness.set(thickness, group);
  }
  for (const [thickness, group] of backPanelByThickness) {
    const backPanelAmount = roundTwo(group.amount);
    coreMaterials.push({
      itemName: "Back panel plywood",
      imageUrl: null,
      plywoodNos: { quantity: group.sheets, thickness },
      laminateNos: { quantity: 0, thickness: STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      innerLaminate: { quantity: 0, thickness: STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      outerLaminate: { quantity: 0, thickness: STUDIO_QUOTE_ASSUMPTIONS.defaultLaminateThickness },
      carpenters: 0,
      days: 0,
      profitOnMaterial: 0,
      profitOnLabour: 0,
      studioMaterialCost: backPanelAmount,
      rowTotal: 0, // worked out just below
      // Keep this exact start: it is read back by studioBoardAmountOf() in FurnitureForm.tsx.
      remarks: `${STUDIO_BOARDS_TAG_START}${backPanelAmount}${STUDIO_BOARDS_TAG_END} From 3D studio: back panel ${thickness} mm, ${roundTwo(group.squareFeet)} sq ft = ${group.sheets} plywood sheets (8 × 4 ft), ₹${backPanelAmount} at the studio's rates; no laminate; labour is in the first row`,
    });
  }

  // Row totals the same way as the internal quote and quote variant pages:
  //   labour (carpenters × days of row 0 × rate × (1 + profitOnLabour %)) and fabrication are split EVENLY across
  //   the core rows, so  row = (studio board amount of the row + labour / rows + fabrication / rows) × (1 + profit %).
  //   Sum of the rows = (all boards + labour + fabrication) × (1 + profit %): the same total as the studio.
  const labourAndFabricationPerRow = coreMaterials.length > 0 ? (coreLabour + fabricationCost) / coreMaterials.length : 0;
  for (const row of coreMaterials) row.rowTotal = roundTwo((toNumber(row.studioMaterialCost) + labourAndFabricationPerRow) * profitFactor);
  //////////////////////////CHAGNES ENDED///////////////////////////


  const fittingsAndAccessories: InternalQuoteSimpleItem[] = [
    ...fittingLines.map((line) => lineAsSimpleItem(line, profitPercentage)),
    ...(item.accessories ?? []).map((accessory) =>
      simpleItem(accessory.label || readableName(accessory.accessoryType), "Accessory", accessory.rateConfigurationItemId, accessory.rateConfigurationItemName, Math.max(1, toNumber(accessory.quantity) || 1), toNumber(accessory.unitPrice), profitPercentage)),
  ];

  // Boards are no longer non-brand rows: their sheets and the studio amount are in the core row above.
  const labourRows: InternalQuoteSimpleItem[] = [];
  if (labour && helperCost > 0) {
    const helperManDays = toNumber(labour.helperHours) / Math.max(1, toNumber(labour.hoursPerDay) || 7);
    const quantity = roundTwo(helperManDays) || 1;
    labourRows.push(simpleItem("Helper for carpentry", `man-days (${labour.helperHours} helper hours)`, null, "", quantity, helperCost / quantity, profitPercentage));
  } else if (!labour && labourCost > 0) {
    labourRows.push(simpleItem("Carpentry labour", "lump sum (studio saved before labour details)", null, "", 1, labourCost, profitPercentage));
  }
  // Exact rupees: cost is rounded to paise, so quantity × cost can be a few paise off; the row total keeps the studio amount.
  for (const row of labourRows) row.rowTotal = roundTwo(row.quantity * row.cost * (1 + profitPercentage / 100));

  ///////////////////CHAGNES STARTED//////////////////////////////////
  // const nonBrandMaterials: InternalQuoteSimpleItem[] = [...otherLines.map((line) => lineAsSimpleItem(line, profitPercentage)), ...labourRows];
  ////////////////////////CHAGNES STARTED/////////////////////
  // Back panel is now a CORE material row (above), so it is no longer added here.
  // // Back panel plywood in whole sheets (closed units), at the studio's amount.
  // const backPanelRows = backPanelLines.filter((line) => toNumber(line.quantity) > 0).map((line) => {
  // const sheets = toNumber(line.sheetsRequired) || sheetsFor(toNumber(line.quantity));
  // const thickness = toNumber(line.thickness) || STUDIO_QUOTE_ASSUMPTIONS.defaultBackPanelThickness;

  //   // const row = simpleItem(`Back panel plywood ${thickness} mm`, ...);
  //   const row = simpleItem("Plywood", `Back panel ${thickness} mm · ${sheets} sheets (8 × 4 ft) · ${roundTwo(toNumber(line.quantity))} sq ft`, line.rateConfigurationItemId ?? master?.backPanel?.rateConfigurationItemId ?? null, line.rateConfigurationItemName || master?.backPanel?.rateConfigurationItemName || "", sheets, sheets > 0 ? toNumber(line.totalPrice) / sheets : 0, profitPercentage);
  //   row.rowTotal = roundTwo(toNumber(line.totalPrice) * (1 + profitPercentage / 100));
  //   return row;
  // });
  // const nonBrandMaterials: InternalQuoteSimpleItem[] = [...backPanelRows, ...otherLines.map((line) => lineAsSimpleItem(line, profitPercentage)), ...labourRows];
  const nonBrandMaterials: InternalQuoteSimpleItem[] = [...otherLines.map((line) => lineAsSimpleItem(line, profitPercentage)), ...labourRows];
  //////////////////////////CHAGNES ENDED///////////////////////////
  /////////////////////CHAGNES ENDED///////////////////////////////////

  // const nonBrandMaterials: InternalQuoteSimpleItem[] = otherLines.map((line) => lineAsSimpleItem(line, profitPercentage));
  // A catalogue product (bought ready) has no boards: it goes in as one line.
  if (item.pricingMethod === "rateConfigurationItem") {
    nonBrandMaterials.push(simpleItem(item.rateConfigurationItemName || readableName(item.furnitureType), "Catalogue product", item.rateConfigurationItemId, item.rateConfigurationItemName, Math.max(1, toNumber(item.quantity) || 1), toNumber(item.unitPrice), profitPercentage));
  }

  const coreMaterialsTotal = sumRowTotals(coreMaterials);
  const fittingsAndAccessoriesTotal = sumRowTotals(fittingsAndAccessories);
  const nonBrandMaterialsTotal = sumRowTotals(nonBrandMaterials);

  return {
    furnitureName,
    dimention: { height: toNumber(item.height) || null, width: toNumber(item.width) || null, depth: toNumber(item.depth) || null }, // millimetres, as in the studio
    furnitureProfit: profitPercentage,
    // fabricationCost: 0,

    ///////////////////CHAGNES STARTED//////////////////////////////////
    // fabricationCost: 0,
    fabricationCost,
    /////////////////////CHAGNES ENDED///////////////////////////////////

    coreMaterials,
    fittingsAndAccessories,
    glues: [],
    nonBrandMaterials,
    coreMaterialsTotal,
    fittingsAndAccessoriesTotal,
    gluesTotal: 0,
    nonBrandMaterialsTotal,
    furnitureTotal: coreMaterialsTotal + fittingsAndAccessoriesTotal + nonBrandMaterialsTotal,
    // plywoodBrandId: carcassLines[0]?.rateConfigurationItemId ?? null,
    // innerLaminateBrandId: null, // the studio has no inner laminate choice yet
    // outerLaminateBrandId: shutterBoardLines[0]?.rateConfigurationItemId ?? null,
    // This furniture's own plywood and outer laminate (what the studio priced); the whole-home choice when it has none.
    // Inner laminate has no furniture-level choice in the studio, so it is the whole-home one.
    plywoodBrandId: carcassLines[0]?.rateConfigurationItemId ?? master?.plywood?.rateConfigurationItemId ?? null,
    innerLaminateBrandId: master?.innerLaminate?.rateConfigurationItemId ?? null,
    outerLaminateBrandId: shutterBoardLines[0]?.rateConfigurationItemId ?? master?.outerLaminate?.rateConfigurationItemId ?? null,

    typeOfWork: "modular",
    typeOfNonModularWork: null,
    works: [],
  };
};

/* ------------------------------------------------------------------ */
/* Common materials: walls, floor, ceiling, lights, electrical points  */
/* ------------------------------------------------------------------ */

interface PricedPart { unitPrice?: number; quantity?: number; unit?: string; totalPrice?: number; rateConfigurationItemId?: unknown; rateConfigurationItemName?: string }

/** Collects priced parts into common material rows: parts with the same name and rate become one row. */
const createCommonRows = (groupName: string) => {
  const rowsByKey = new Map<string, InternalQuoteSimpleItem>();
  return {
    add: (itemName: string, part: PricedPart | null | undefined, quantityOverride?: number): void => {
      if (!part) return;
      const quantity = toNumber(quantityOverride ?? part.quantity);
      if (quantity <= 0) return;
      const unit = String(part.unit ?? "squareFoot");
      const rate = toNumber(part.unitPrice);
      const key = `${itemName}|${unit}|${rate}`;
      const row = rowsByKey.get(key) ?? {
        itemName,
        description: `${groupName} · ${UNIT_WORDS[unit] ?? unit}`,
        brandId: part.rateConfigurationItemId ?? null,
        brandName: part.rateConfigurationItemName || null,
        imageUrl: null,
        quantity: 0,
        profitOnMaterial: 0, // the studio adds no margin on these materials
        cost: roundTwo(rate),
        rowTotal: 0,
      };
      row.quantity = roundTwo(row.quantity + quantity);
      row.rowTotal = roundTwo(row.rowTotal + rate * quantity); // quantity × cost
      rowsByKey.set(key, row);
    },
    rows: (): InternalQuoteSimpleItem[] => [...rowsByKey.values()],
  };
};

const totalOf = (rows: ReadonlyArray<{ rowTotal: number }>): number => roundTwo(rows.reduce((sum, row) => sum + toNumber(row.rowTotal), 0));

/**
 * Walls, floor (with skirting), ceiling (with cove light), lights (with wiring) and electrical points of every
 * room, and its doors, windows and decor items, as common material rows: quantity × cost, the same amounts the
 * studio totals use (rowTotal here is before profit; the profit is added in studioToInternalQuote).
 */
export const roomFinishesToCommonMaterials = (rooms: ReadonlyArray<Room>): Record<"walls" | "floor" | "ceiling" | "openings" | "lighting" | "electrical" | "decor", InternalQuoteSimpleItem[]> => {
  const names = STUDIO_QUOTE_ASSUMPTIONS.commonGroupNames;
  const walls = createCommonRows(names.walls);
  const floor = createCommonRows(names.floor);
  const ceiling = createCommonRows(names.ceiling);
  const lighting = createCommonRows(names.lighting);
  const electrical = createCommonRows(names.electrical);
  const openings = createCommonRows(names.openings);
  const decor = createCommonRows(names.decor);
  for (const room of rooms) {
    const roomName = room.name || "Room";
    for (const wall of room.walls ?? []) {
      for (const layer of wall.layers ?? []) walls.add(`${roomName}: ${readableName(layer.layerType)}`, layer);
    }
    if (room.floor) {
      floor.add(`${roomName}: ${readableName(room.floor.finishType)} floor`, room.floor);
      const skirting = room.floor.skirting;
      if (skirting && String(skirting.material ?? "none") !== "none") floor.add(`${roomName}: ${readableName(String(skirting.material))} skirting`, skirting);
    }
    if (room.ceiling && String(room.ceiling.ceilingType) !== "none") {
      ceiling.add(`${roomName}: ${readableName(room.ceiling.ceilingType)} false ceiling`, room.ceiling);
      if (room.ceiling.hasCoveLight) ceiling.add(`${roomName}: Cove LED strip with driver`, room.ceiling.coveLight);
    }
    for (const light of room.lights ?? []) {
      // Same as the studio's recalculateLight: every light is counted, quantity at least 1, wiring at least 1.
      lighting.add(`${roomName}: ${readableName(light.lightType)}`, { ...light, unit: "piece" }, toNumber(light.quantity) > 0 ? toNumber(light.quantity) : 1);
      if (light.wiring && toNumber(light.wiring.unitPrice) > 0) lighting.add(`${roomName}: Wiring for ${readableName(light.lightType).toLowerCase()}`, light.wiring, toNumber(light.wiring.quantity) || 1);
    }
    for (const point of room.electricalPoints ?? []) {
      if (point.isIncludedInQuote) electrical.add(`${roomName}: ${readableName(point.pointType)}`, point);
    }
    for (const opening of room.openings ?? []) {
      // Same as the studio's recalculateOpening: only openings included in the quote; a door or window priced
      // from several lines (frame, shutter, mesh, grill ...) goes in as one piece at its total price.
      if (!opening.isIncludedInQuote) continue;
      const productName = String(opening.productType ?? "").trim();
      const itemName = `${roomName}: ${readableName(opening.openingType)}${productName ? `, ${readableName(productName).toLowerCase()}` : ""}`;
      if ((opening.priceBreakdown ?? []).length > 0) openings.add(itemName, { unitPrice: toNumber(opening.totalPrice), unit: "piece" }, 1);
      else openings.add(itemName, opening);
    }
    for (const decorItem of room.decorItems ?? []) {
      if (decorItem.isIncludedInQuote) decor.add(`${roomName}: ${decorItem.label || readableName(decorItem.decorType)}`, decorItem);
    }
  }
  return { walls: walls.rows(), floor: floor.rows(), ceiling: ceiling.rows(), openings: openings.rows(), lighting: lighting.rows(), electrical: electrical.rows(), decor: decor.rows() };
};

/* ------------------------------------------------------------------ */
/* Common materials: labour of the other trades                        */
/* ------------------------------------------------------------------ */

/**
 * One common material row per trade, from the Labour Engine record saved on the studio
 * (labourPlan.latestRecord.costByTrade). The furniture labour is already inside each furniture, so it is taken
 * out of the carpentry row; what is left there is room setting-out, the buffer day and wall panelling.
 *
 *   quantity = skilled man-days of the trade
 *   cost     = trade cost × (1 + hub labour %) / man-days     -> rate per man-day, helpers included
 *   rowTotal = quantity × cost here (before profit; the profit is added in studioToInternalQuote)
 */
export const siteLabourToCommonMaterials = (studio: IStudio, furnitureLabourCost: number, labourFactor: number, warnings: string[]): { rows: InternalQuoteSimpleItem[]; costBeforeMargin: number } => {
  const record = studio.labourPlan?.latestRecord ?? null;
  if (!record) {
    warnings.push("This studio has no saved Labour Engine calculation, so only the furniture labour is in the internal quote. Open the studio and save it once.");
    return { rows: [], costBeforeMargin: 0 };
  }
  const groupName = STUDIO_QUOTE_ASSUMPTIONS.commonGroupNames.labour;
  const rows: InternalQuoteSimpleItem[] = [];
  let costBeforeMargin = 0;
  let tradeCostTotal = 0;
  const addRow = (tradeName: string, note: string, cost: number, skilledManDays: number, daysOnSite: number): void => {
    if (cost <= 0.005) return;
    const manDays = roundTwo(skilledManDays) > 0 ? roundTwo(skilledManDays) : 1;
    const workers = Math.max(1, Math.round(daysOnSite > 0 ? manDays / daysOnSite : 1));
    rows.push({
      itemName: `Labour: ${tradeName}`,
      description: `${groupName} · ${manDays} man-days (about ${workers} ${workers === 1 ? "worker" : "workers"} × ${roundTwo(manDays / workers)} days)${note ? ` · ${note}` : ""}`,
      brandId: null,
      brandName: null,
      imageUrl: null,
      quantity: manDays,
      profitOnMaterial: 0,
      cost: roundTwo((cost * labourFactor) / manDays),
      rowTotal: roundTwo(cost * labourFactor),
    });
    costBeforeMargin += cost;
  };
  for (const [tradeKey, trade] of Object.entries(record.costByTrade ?? {})) {
    const cost = toNumber(trade.cost);
    tradeCostTotal += cost;
    const tradeName = String(trade.name || readableName(tradeKey)).split(" (")[0];
    if (tradeKey === "carpentry") {
      // Furniture (module) labour is all carpentry; it is already in the furniture entries.
      const otherCost = Math.max(0, cost - furnitureLabourCost);
      const share = cost > 0 ? otherCost / cost : 0;
      addRow(tradeName, "setting-out, buffer and wall panelling; furniture labour is inside each furniture", otherCost, toNumber(trade.skilledManDays) * share, toNumber(trade.days) * share);
    } else {
      addRow(tradeName, "", cost, toNumber(trade.skilledManDays), toNumber(trade.days));
    }
  }
  // A record saved before the per-trade costs existed (or with costs that do not add up): keep the total right.
  const missing = roundTwo(toNumber(record.labourCost) - (tradeCostTotal > 0 ? tradeCostTotal : furnitureLabourCost));
  if (missing > 1) addRow("Other trades", "no per-trade split saved on this studio", missing, 0, 0);
  return { rows, costBeforeMargin: roundTwo(costBeforeMargin) };
};

/* ------------------------------------------------------------------ */
/* The whole studio                                                    */
/* ------------------------------------------------------------------ */

/** "Name: message" repeated for many furniture items becomes one line: "12 furniture items: message (Name, Name, Name and 9 more)". */
const groupWarnings = (warnings: string[]): string[] => {
  const namesByMessage = new Map<string, string[]>();
  const grouped: string[] = [];
  for (const warning of [...new Set(warnings)]) {
    const separatorIndex = warning.indexOf("): ");
    if (separatorIndex < 0) { grouped.push(warning); continue; }
    const message = warning.slice(separatorIndex + 3);
    namesByMessage.set(message, [...(namesByMessage.get(message) ?? []), warning.slice(0, separatorIndex + 1)]);
  }
  const fromFurniture = [...namesByMessage].map(([message, names]) =>
    names.length === 1 ? `${names[0]}: ${message}` : `${names.length} furniture items: ${message} (${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""})`);
  return [...fromFurniture, ...grouped];
};

// export const studioToInternalQuote = (studio: IStudio, options: { quoteNo?: string | null; quoteCategory?: string | null } = {}): StudioToInternalQuoteResult => {
/** carpenterDayRate: the rate configuration's carpenter day rate (category "plywood"), sent by the button. */
export const studioToInternalQuote = (studio: IStudio, options: { quoteNo?: string | null; quoteCategory?: string | null; carpenterDayRate?: number | null } = {}): StudioToInternalQuoteResult => {
  const master = studio.masterMaterials ?? null;
  const pageCarpenterDayRate = toNumber(options.carpenterDayRate);

  const warnings: string[] = [];
  const marginPercentage = toNumber(studio.pricingSettings?.marginPercentage);
  // The studio applies the hub labour % once on the labour total; here it goes on every labour amount, so the totals agree.
  const labourFactor = 1 + toNumber(studio.hub?.labourPercentage) / 100;
  const rooms = studio.rooms ?? [];

  const furnitures: InternalQuoteFurniture[] = [];
  let furnitureLabourCost = 0;
  for (const room of rooms) {
    for (const item of room.furniture ?? []) {
      // furnitures.push(furnitureToInternalQuote(item, room, marginPercentage, labourFactor, warnings));
      furnitures.push(furnitureToInternalQuote(item, room, marginPercentage, labourFactor, warnings, pageCarpenterDayRate, master));

      furnitureLabourCost += furnitureLabourCostOf(item);
    }
  }
  furnitureLabourCost = roundTwo(furnitureLabourCost);
  if (furnitures.length === 0) warnings.push("This studio has no furniture, so the internal quote has no furniture rows.");
  if (pageCarpenterDayRate <= 0 && furnitures.length > 0) warnings.push("The carpenter rate of the labour rate configuration was not sent, so the Labour Engine's rate is used. If the two rates differ, the internal quote page will show a different labour amount.");


  // Everything that does not belong to a furniture goes to commonMaterials.
  //////////////////////////CHAGNES STARTED//////////////////////////
  // const finishes = roomFinishesToCommonMaterials(rooms);
  const allFinishes = roomFinishesToCommonMaterials(rooms);
  /////////////////////////////CHANGES ENDED//////////////////////////
  // 

  const names = STUDIO_QUOTE_ASSUMPTIONS.commonGroupNames;


  //////////////////////////CHAGNES STARTED//////////////////////////
  // for (const [groupName, groupRows] of [[names.walls, finishes.walls], [names.floor, finishes.floor], [names.ceiling, finishes.ceiling], [names.openings, finishes.openings], [names.lighting, finishes.lighting], [names.electrical, finishes.electrical], [names.decor, finishes.decor]] as const) {
  //   const unpriced = groupRows.filter((row) => row.rowTotal <= 0).length;
  //   if (unpriced > 0) warnings.push(`${groupName}: ${unpriced} of ${groupRows.length} rows have no rate in the studio, so their amount is 0.`);
  // }
  for (const [groupName, groupRows] of [[names.walls, allFinishes.walls], [names.floor, allFinishes.floor], [names.ceiling, allFinishes.ceiling], [names.openings, allFinishes.openings], [names.lighting, allFinishes.lighting], [names.electrical, allFinishes.electrical], [names.decor, allFinishes.decor]] as const) {
    const unpriced = groupRows.filter((row) => row.rowTotal <= 0).length;
    if (unpriced > 0) warnings.push(`${groupName}: ${unpriced} of ${groupRows.length} rows are ₹0 in the studio (no rate), so they are left out of the common materials.`);
  }
  // Common materials only: a ₹0 row (quantity × cost = 0) is not added as an item. Checked before the profit is
  // spread, so the profit is split only across the rows that are really in the quote.
  const withAmount = (rows: InternalQuoteSimpleItem[]): InternalQuoteSimpleItem[] => rows.filter((row) => toNumber(row.rowTotal) > 0);
  const finishes = {
    walls: withAmount(allFinishes.walls),
    floor: withAmount(allFinishes.floor),
    ceiling: withAmount(allFinishes.ceiling),
    openings: withAmount(allFinishes.openings),
    lighting: withAmount(allFinishes.lighting),
    electrical: withAmount(allFinishes.electrical),
    decor: withAmount(allFinishes.decor),
  };
  /////////////////////////////CHANGES ENDED//////////////////////////

  const siteLabour = STUDIO_QUOTE_ASSUMPTIONS.includeSiteLabourInCommonMaterials
    ? siteLabourToCommonMaterials(studio, furnitureLabourCost, labourFactor, warnings)
    : { rows: [] as InternalQuoteSimpleItem[], costBeforeMargin: 0 };
  if (!STUDIO_QUOTE_ASSUMPTIONS.includeSiteLabourInCommonMaterials) warnings.push("The labour of the other trades (painting, tiling, ceiling, electrical ...) is not in this internal quote.");
  // Additional charges (e.g. transport): one common material row per charge, quantity 1, cost = rate = amount.
  // const additionalChargeRows: InternalQuoteSimpleItem[] = (studio.additionalCharges ?? [])
  //   .filter((charge) => toNumber(charge.amount) > 0)

  const additionalChargeRows: InternalQuoteSimpleItem[] = (studio.additionalCharges ?? [])
    .filter((charge) => toNumber(charge.amount) > 0)
    .map((charge) => ({
      itemName: charge.workName || null,
      description: names.additionalCharges,
      brandId: null,
      brandName: null,
      imageUrl: null,
      quantity: 1,
      profitOnMaterial: 0,
      cost: roundTwo(toNumber(charge.amount)),
      rowTotal: roundTwo(toNumber(charge.amount)),
    }));

  const materialRows = [...finishes.walls, ...finishes.floor, ...finishes.ceiling,
  ...finishes.openings, ...finishes.lighting, ...finishes.electrical, ...finishes.decor,
  ...additionalChargeRows
  ];
  const commonMaterials = [...materialRows, ...siteLabour.rows];

  // Profit on the common pool. Up to here every common rowTotal is quantity × cost (before profit).
  const materialBase = totalOf(materialRows);
  const labourBase = totalOf(siteLabour.rows);
  // Group totals for the summary, before profit (the pool profit is a flat amount per row, so it is shown on its own).
  const groupBase = {
    walls: totalOf(finishes.walls), floor: totalOf(finishes.floor), ceiling: totalOf(finishes.ceiling), openings: totalOf(finishes.openings),
    lighting: totalOf(finishes.lighting), electrical: totalOf(finishes.electrical), decor: totalOf(finishes.decor),
  };
  let commonProfitPercentage = 0;
  let commonProfitAmount = 0;
  let commonMaterialProfitNotInStudio = 0;
  if (STUDIO_QUOTE_ASSUMPTIONS.applyGlobalProfitToCommonMaterials) {
    // Internal quote rule: profit of the whole pool = sum of (quantity × cost) × commonProfitOverride %,
    // split evenly across all rows, so every row gets the same flat amount. No row has its own profit %.
    commonProfitPercentage = marginPercentage;
    commonProfitAmount = roundTwo(((materialBase + labourBase) * commonProfitPercentage) / 100);
    const profitPerRow = commonMaterials.length > 0 ? commonProfitAmount / commonMaterials.length : 0;
    for (const row of commonMaterials) row.rowTotal = roundTwo(row.rowTotal + profitPerRow);
    commonMaterialProfitNotInStudio = roundTwo((materialBase * commonProfitPercentage) / 100);
    // if (commonMaterialProfitNotInStudio > 0) warnings.push(`The internal quote adds ${commonProfitPercentage}% profit on wall, floor, ceiling, door, window, light, electrical and decor materials (₹${commonMaterialProfitNotInStudio}). The studio price does not have this profit, so the internal quote is higher than the studio by this amount.`);

    //////////////////////////CHAGNES STARTED//////////////////////////
    // Shown in the preview, which is screen-shared with the client: no "profit" word or margin %.
    // if (commonMaterialProfitNotInStudio > 0) warnings.push(`The internal quote adds ${commonProfitPercentage}% profit on wall, floor, ceiling, door, window, light, electrical and decor materials (₹${commonMaterialProfitNotInStudio}). The studio price does not have this profit, so the internal quote is higher than the studio by this amount.`);
    if (commonMaterialProfitNotInStudio > 0) warnings.push(`The internal quote adds ₹${commonMaterialProfitNotInStudio} on the common materials (wall, floor, ceiling, door, window, light, electrical and decor). The studio price does not have this amount, so the internal quote is higher than the studio by it.`);
    /////////////////////////////CHANGES ENDED//////////////////////////
  } else {
    // Same as the studio: no margin on materials; margin on labour, carried by each labour row.
    for (const row of siteLabour.rows) {
      row.profitOnMaterial = marginPercentage;
      row.rowTotal = roundTwo(row.rowTotal * (1 + marginPercentage / 100));
    }
    commonProfitAmount = roundTwo((labourBase * marginPercentage) / 100);
  }
  // if ((studio.additionalCharges ?? []).length > 0) warnings.push("The studio's additional charges are not copied into the internal quote.");

  // const firstId = (pick: (furniture: InternalQuoteFurniture) => unknown | null): unknown | null => {
  //   for (const furniture of furnitures) { const found = pick(furniture); if (found) return found; }
  //   return null;
  // };


  const furnitureTotal = roundTwo(furnitures.reduce((sum, furniture) => sum + furniture.furnitureTotal, 0));
  const grandTotal = Math.round(furnitureTotal + totalOf(commonMaterials));
  const coreRows = furnitures.flatMap((furniture) => furniture.coreMaterials);
  const studioSubtotal = roundTwo(toNumber(studio.totals?.subtotal));

  return {
    quote: {
      quoteNo: options.quoteNo ?? null,
      quoteType: STUDIO_QUOTE_ASSUMPTIONS.quoteType,
      organizationId: studio.organizationId,
      projectId: studio.projectId ?? null,
      mainQuoteName: studio.quoteName || studio.quoteNo || null,
      quoteCategory: options.quoteCategory ?? STUDIO_QUOTE_ASSUMPTIONS.defaultQuoteCategory,
      // plywoodBrandId: firstId((furniture) => furniture.plywoodBrandId),
      // innerLaminateId: null,
      // outerLaminateId: firstId((furniture) => furniture.outerLaminateBrandId),

      // plywoodBrandId: null,
      // innerLaminateId: null,
      // outerLaminateId: null,
      // The whole-home (master) plywood and laminates chosen on the studio variant page; null when not chosen.
      plywoodBrandId: master?.plywood?.rateConfigurationItemId ?? null,
      innerLaminateId: master?.innerLaminate?.rateConfigurationItemId ?? null,
      outerLaminateId: master?.outerLaminate?.rateConfigurationItemId ?? null,

      sqftRateWork: [],
      furnitures,
      commonMaterials,
      // The profit % of the common pool (the global profit %); 0 when each labour row carries its own profit instead.
      commonProfitOverride: commonProfitPercentage,
      globalTransportation: 0,
      globalProfitPercent: marginPercentage,

      ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
      // Tells the internal quote and quote variant pages to read the studio board amount of each core row.
      fromInternalQuote: true,
      gstPercent: toNumber(studio.pricingSettings?.gstPercentage),

      ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////

      mainQuote: null,
      grandTotal,
      notes: `Created from 3D studio ${studio.quoteNo} (version ${studio.version})`,
      isProductSpecific: false,
    },
    warnings: groupWarnings(warnings),
    summary: {
      furnitureCount: furnitures.length,
      ////////////////////////////////CHANGES STARTED/////////////////////////////////////////
      // Sheets counted from the studio (same numbers as the core rows; also counts furniture without a core row).
      ///////////////////////////////CHANGES ENDED////////////////////////////////////////////////
      plywoodSheets: sheetCountOf(rooms).plywood,
      laminateSheets: sheetCountOf(rooms).laminate,
      // plywoodSheets: coreRows.reduce((sum, row) => sum + toNumber(row?.plywoodNos?.quantity), 0),
      // laminateSheets: coreRows.reduce((sum, row) => sum + toNumber(row?.laminateNos?.quantity), 0),
      // carpenterDays: roundTwo(coreRows.reduce((sum, row) => sum + row?.carpenters * row?.days, 0)),
      carpenterDays: roundTwo(coreRows.reduce((sum, row) => sum + (row?.carpenters ?? 0) * (row?.days ?? 0), 0)),
      furnitureLabourCost,
      otherLabourCost: siteLabour.costBeforeMargin,
      furnitureTotal,
      wallsTotal: groupBase.walls,
      floorTotal: groupBase.floor,
      ceilingTotal: groupBase.ceiling,
      openingsTotal: groupBase.openings,
      lightingTotal: groupBase.lighting,
      electricalTotal: groupBase.electrical,
      decorTotal: groupBase.decor,
      siteLabourTotal: labourBase,
      commonProfitPercentage,
      commonProfitAmount,
      grandTotal,
      
      gstPercent: toNumber(studio.pricingSettings?.gstPercentage),
      gstAmount: Math.round((grandTotal * toNumber(studio.pricingSettings?.gstPercentage)) / 100),
      grandTotalWithGst: grandTotal + Math.round((grandTotal * toNumber(studio.pricingSettings?.gstPercentage)) / 100),
      
      studioSubtotal,


      commonMaterialProfitNotInStudio,
      // = commonMaterialProfitNotInStudio (plus a few rupees of rounding) when the studio was saved with the current pricing.
      differenceFromStudio: roundTwo(grandTotal - studioSubtotal),
    },
  };
};