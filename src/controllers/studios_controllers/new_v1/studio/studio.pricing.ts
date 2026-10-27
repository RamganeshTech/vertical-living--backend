/**
 * Pricing integrity for a studio.
 *
 * The designer sees prices that the frontend works out live. Before every save the backend
 * recalculates every total from the stored unit prices and quantities, so the saved quote is
 * always internally consistent (no line, room or project total can disagree with its parts).
 * Geometry (areas, running feet, panel areas) is measured by the frontend and stored as quantities.
 */
import type {
  CeilingFinish,
  DecorItem,
  ElectricalPoint,
  FloorFinish,
  FurnitureItem,
  Opening,
  PriceBreakdownLine,
  PricedFields,
  PricingSettings,
  Room,
  StudioLight,
  StudioTotals,
  Wall,
} from "./studio.types";

type PricedLine = Pick<PricedFields, "unitPrice" | "quantity" | "totalPrice">;

export const roundCurrency = (amount: number): number => Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;

const recalculateLine = (pricedLine: PricedLine): number => {
  pricedLine.totalPrice = roundCurrency(pricedLine.unitPrice * pricedLine.quantity);
  return pricedLine.totalPrice;
};

const sumBreakdown = (breakdownLines: PriceBreakdownLine[]): number =>
  roundCurrency(breakdownLines.reduce((runningTotal, breakdownLine) => runningTotal + recalculateLine(breakdownLine), 0));

const recalculateWalls = (walls: Wall[]): number =>
  roundCurrency(
    walls.reduce(
      (wallsTotal, wall) => wallsTotal + wall.layers.reduce((layersTotal, wallLayer) => layersTotal + recalculateLine(wallLayer), 0),
      0
    )
  );

const recalculateFloor = (floor: FloorFinish): number => roundCurrency(recalculateLine(floor) + recalculateLine(floor.skirting));

const recalculateCeiling = (ceiling: CeilingFinish): number => {
  if (ceiling.ceilingType === "none") {
    ceiling.totalPrice = 0;
    ceiling.coveLight.totalPrice = 0;
    return 0;
  }
  const boardTotal = recalculateLine(ceiling);
  const coveTotal = ceiling.hasCoveLight ? recalculateLine(ceiling.coveLight) : 0;
  if (!ceiling.hasCoveLight) ceiling.coveLight.totalPrice = 0;
  return roundCurrency(boardTotal + coveTotal);
};

const recalculateOpening = (opening: Opening): number => {
  if (opening.priceBreakdown.length > 0) {
    opening.totalPrice = sumBreakdown(opening.priceBreakdown);
  } else {
    recalculateLine(opening);
  }
  return opening.isIncludedInQuote ? opening.totalPrice : 0;
};

export const recalculateFurnitureItem = (furnitureItem: FurnitureItem, pricingSettings: PricingSettings): number => {
  const accessoriesTotal = roundCurrency(
    furnitureItem.accessories.reduce((runningTotal, accessory) => runningTotal + recalculateLine(accessory), 0)
  );
  if (furnitureItem.pricingMethod === "rateConfigurationItem") {
    const productTotal = roundCurrency(furnitureItem.unitPrice * furnitureItem.quantity);
    furnitureItem.materialCost = roundCurrency(productTotal + accessoriesTotal);
    furnitureItem.labourCost = 0;
    furnitureItem.installationCost = 0;
    furnitureItem.marginAmount = 0;
    furnitureItem.totalPrice = furnitureItem.materialCost;
    return furnitureItem.totalPrice;
  }
  const materialCost = roundCurrency(sumBreakdown(furnitureItem.priceBreakdown) + accessoriesTotal);
  // const labourCost = roundCurrency((materialCost * pricingSettings.labourPercentage) / 100);

  const SQUARE_MILLIMETRES_PER_SQUARE_FOOT = 92903.04;
  const labourArea = (furnitureItem.width * furnitureItem.height) / SQUARE_MILLIMETRES_PER_SQUARE_FOOT;
  const labourCost =
    furnitureItem.labourCategoryName && furnitureItem.labourRatePerSquareFoot > 0
      ? roundCurrency(labourArea * furnitureItem.labourRatePerSquareFoot)
      : roundCurrency((materialCost * pricingSettings.labourPercentage) / 100);

  const installationCost = roundCurrency((materialCost * pricingSettings.installationPercentage) / 100);
  const marginAmount = roundCurrency(((materialCost + labourCost + installationCost) * pricingSettings.marginPercentage) / 100);
  furnitureItem.materialCost = materialCost;
  furnitureItem.labourCost = labourCost;
  furnitureItem.installationCost = installationCost;
  furnitureItem.marginAmount = marginAmount;
  furnitureItem.totalPrice = roundCurrency(materialCost + labourCost + installationCost + marginAmount);
  return furnitureItem.totalPrice;
};

/** Lights are priced per item: every light record is one fitting, so quantity is 1 and the unit is "piece". */
const recalculateLight = (light: StudioLight): number => {
  light.quantity = 1;
  light.unit = "piece";
  const fittingTotal = recalculateLine(light);
  const wiringTotal = recalculateLine(light.wiring);
  return light.isIncludedInQuote ? roundCurrency(fittingTotal + wiringTotal) : 0;
};

const recalculateIncluded = (pricedItem: PricedLine & { isIncludedInQuote: boolean }): number => {
  recalculateLine(pricedItem);
  return pricedItem.isIncludedInQuote ? pricedItem.totalPrice : 0;
};

export const recalculateRoom = (room: Room, pricingSettings: PricingSettings): number => {
  const furnitureTotal = roundCurrency(
    room.furniture.reduce((runningTotal, furnitureItem) => runningTotal + recalculateFurnitureItem(furnitureItem, pricingSettings), 0)
  );
  const wallsTotal = recalculateWalls(room.walls);
  const floorTotal = recalculateFloor(room.floor);
  const ceilingTotal = recalculateCeiling(room.ceiling);
  const openingsTotal = roundCurrency(room.openings.reduce((runningTotal, opening) => runningTotal + recalculateOpening(opening), 0));
  const lightingTotal = roundCurrency(room.lights.reduce((runningTotal, light) => runningTotal + recalculateLight(light), 0));
  const electricalTotal = roundCurrency(
    room.electricalPoints.reduce(
      (runningTotal, electricalPoint: ElectricalPoint) => runningTotal + recalculateIncluded(electricalPoint),
      0
    )
  );
  const decorTotal = roundCurrency(
    room.decorItems.reduce((runningTotal, decorItem: DecorItem) => runningTotal + recalculateIncluded(decorItem), 0)
  );
  const subtotal = roundCurrency(
    furnitureTotal + wallsTotal + floorTotal + ceilingTotal + openingsTotal + lightingTotal + electricalTotal + decorTotal
  );
  room.pricing.furnitureTotal = furnitureTotal;
  room.pricing.wallsTotal = wallsTotal;
  room.pricing.floorTotal = floorTotal;
  room.pricing.ceilingTotal = ceilingTotal;
  room.pricing.openingsTotal = openingsTotal;
  room.pricing.lightingTotal = lightingTotal;
  room.pricing.electricalTotal = electricalTotal;
  room.pricing.decorTotal = decorTotal;
  room.pricing.subtotal = subtotal;
  return subtotal;
};

/** Recalculates every line, room and the project totals in place, and returns the totals. */
export const recalculateStudioPricing = (
  studio: { rooms: Room[]; pricingSettings: PricingSettings; totals: StudioTotals }
): StudioTotals => {
  const subtotal = roundCurrency(studio.rooms.reduce((runningTotal, room) => runningTotal + recalculateRoom(room, studio.pricingSettings), 0));
  // The project adjustment (+ or −) applies to the whole subtotal, before GST.
  const adjustmentAmount = roundCurrency((subtotal * (studio.pricingSettings.projectAdjustmentPercentage ?? 0)) / 100);
  const taxableAmount = roundCurrency(subtotal + adjustmentAmount);
  const gstAmount = roundCurrency((taxableAmount * studio.pricingSettings.gstPercentage) / 100);
  studio.totals.subtotal = subtotal;
  studio.totals.adjustmentAmount = adjustmentAmount;
  studio.totals.gstAmount = gstAmount;
  studio.totals.grandTotal = roundCurrency(taxableAmount + gstAmount);
  return { subtotal, adjustmentAmount, gstAmount, grandTotal: studio.totals.grandTotal };
};

/* ------------------------------------------------------------------ */
/* Price lock                                                          */
/* ------------------------------------------------------------------ */

type PricedJson = { [fieldName: string]: unknown };

const isPricedJson = (candidate: unknown): candidate is PricedJson => typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);

const LOCKED_PRICE_FIELDS = ["unitPrice", "rateConfigurationItemId", "rateConfigurationItemName"] as const;

/** What a part's price depends on: a different finish, type or rate key is a different product, so it takes today's rate. */
const PRICE_IDENTITY_FIELDS = ["rateKey", "layerType", "finishType", "material", "ceilingType", "openingType", "lightType", "lengthInRunningFeet", "pointType", "decorType", "accessoryType", "furnitureType"] as const;
const priceIdentityOf = (part: PricedJson): string => JSON.stringify(PRICE_IDENTITY_FIELDS.map((fieldName) => part[fieldName] ?? null));

/**
 * Every priced part of a room by a stable address: its own `_id`, or, for parts without one (floor, skirting,
 * ceiling, cove, a light's wiring), the nearest parent `_id` plus the path from it.
 */
const collectPricedParts = (value: unknown, anchor: string, path: string, found: Map<string, PricedJson>): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectPricedParts(item, anchor, path, found));
    return;
  }
  if (!isPricedJson(value)) return;
  const ownId = value._id === undefined || value._id === null ? "" : String(value._id);
  const address = ownId || `${anchor}/${path}`;
  if (typeof value.unitPrice === "number") found.set(address, value);
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (typeof fieldValue === "object" && fieldValue !== null && !(fieldValue instanceof Date)) {
      collectPricedParts(fieldValue, ownId || anchor, ownId ? fieldName : `${path}.${fieldName}`, found);
    }
  }
};

/**
 * While prices are locked, every part that was already saved keeps its saved unit price and rate item, as long as
 * it is still the same product (same finish, type or rate key); new parts and changed products take today's rates. Quantities are left as sent, so the quote still follows design changes.
 * Returns how many unit prices were put back.
 */
export const keepLockedPrices = (savedRooms: unknown[], incomingRooms: unknown[]): number => {
  const savedParts = new Map<string, PricedJson>();
  collectPricedParts(savedRooms, "", "", savedParts);
  const incomingParts = new Map<string, PricedJson>();
  collectPricedParts(incomingRooms, "", "", incomingParts);
  let restoredCount = 0;
  for (const [address, incomingPart] of incomingParts) {
    const savedPart = savedParts.get(address);
    if (!savedPart || priceIdentityOf(savedPart) !== priceIdentityOf(incomingPart)) continue;
    if (incomingPart.unitPrice !== savedPart.unitPrice) restoredCount += 1;
    for (const fieldName of LOCKED_PRICE_FIELDS) {
      if (fieldName in savedPart) incomingPart[fieldName] = savedPart[fieldName] === null || savedPart[fieldName] === undefined ? savedPart[fieldName] : fieldName === "rateConfigurationItemId" ? String(savedPart[fieldName]) : savedPart[fieldName];
    }
  }
  return restoredCount;
};
