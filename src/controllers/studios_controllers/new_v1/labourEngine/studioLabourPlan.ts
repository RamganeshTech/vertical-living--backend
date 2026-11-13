// studioLabourPlan.ts
/**
 * The labour plan saved on each studio (studio.labourPlan), sent by the browser with the normal updateStudio
 * call. Once prices are locked or the client has approved, the plan is frozen: later saves cannot change it.
 */
import type { FurnitureBuildRoute, LabourCalculationRecord, LabourPlanSettings, StudioLabourPlan } from "./labourEngine.types";

export const MAXIMUM_LABOUR_PLAN_HISTORY = 20;
const SIZE_METHODS = ["rft", "stepped", "fixed"] as const;
const BUILD_ROUTES: readonly FurnitureBuildRoute[] = ["site", "factory"];

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
  typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
const finiteOr = (candidate: unknown, fallback: number): number => (typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback);
const textOr = (candidate: unknown, fallback: string, maximumLength = 200): string => (typeof candidate === "string" ? candidate.slice(0, maximumLength) : fallback);

const parseSettings = (candidate: unknown, errors: string[]): LabourPlanSettings => {
  const source = isRecord(candidate) ? candidate : {};
  const siteFactorPercentage = finiteOr(source.siteFactorPercentage, 0);
  if (siteFactorPercentage < 0 || siteFactorPercentage > 200) errors.push("labourPlan.settings.siteFactorPercentage must be between 0 and 200");
  const crewOverrides: Record<string, number> = {};
  if (isRecord(source.crewOverrides)) {
    for (const [tradeKey, crew] of Object.entries(source.crewOverrides)) {
      const count = Math.round(finiteOr(crew, 0));
      if (count >= 1 && count <= 100) crewOverrides[tradeKey.slice(0, 60)] = count;
    }
  }
  const moduleRoutes: Record<string, FurnitureBuildRoute> = {};
  if (isRecord(source.moduleRoutes)) {
    for (const [itemId, route] of Object.entries(source.moduleRoutes)) {
      if (BUILD_ROUTES.includes(route as FurnitureBuildRoute)) moduleRoutes[itemId.slice(0, 60)] = route as FurnitureBuildRoute;
    }
  }
  const targetDays = source.targetDays == null ? null : finiteOr(source.targetDays, 0) || null;
  return {
    siteFactorPercentage: Math.min(200, Math.max(0, siteFactorPercentage)),
    crewOverrides,
    moduleRoutes,
    startDate: typeof source.startDate === "string" && source.startDate ? source.startDate.slice(0, 30) : null,
    targetDays,
  };
};

const parseRecord = (candidate: unknown): LabourCalculationRecord | null => {
  if (!isRecord(candidate)) return null;
  const sizeMethod = SIZE_METHODS.includes(candidate.sizeMethod as (typeof SIZE_METHODS)[number]) ? (candidate.sizeMethod as LabourCalculationRecord["sizeMethod"]) : "rft";
  return {
    calculatedAt: textOr(candidate.calculatedAt, new Date().toISOString(), 40),
    configVersion: finiteOr(candidate.configVersion, 0),
    sizeMethod,
    sizeMethodName: textOr(candidate.sizeMethodName, ""),
    defaultFurnitureRoute: candidate.defaultFurnitureRoute === "factory" ? "factory" : "site",
    workingDays: finiteOr(candidate.workingDays, 0),
    skilledManDays: finiteOr(candidate.skilledManDays, 0),
    helperDays: finiteOr(candidate.helperDays, 0),
    labourCost: finiteOr(candidate.labourCost, 0),
    moduleLabourCost: finiteOr(candidate.moduleLabourCost, 0),
    sizedUnitCount: finiteOr(candidate.sizedUnitCount, 0),
    sizedHoursMethodA: finiteOr(candidate.sizedHoursMethodA, 0),
    sizedHoursMethodB: finiteOr(candidate.sizedHoursMethodB, 0),
    sizedHoursFixed: finiteOr(candidate.sizedHoursFixed, 0),
  };
};

/** Reads body.labourPlan of an update. Returns undefined when it was not sent. */
export const parseStudioLabourPlan = (candidate: unknown, errors: string[]): Pick<StudioLabourPlan, "settings" | "latestRecord"> | undefined => {
  if (candidate === undefined) return undefined;
  if (!isRecord(candidate)) {
    errors.push("labourPlan must be an object");
    return undefined;
  }
  return { settings: parseSettings(candidate.settings, errors), latestRecord: parseRecord(candidate.latestRecord) };
};

const isSameRecord = (first: LabourCalculationRecord | null | undefined, second: LabourCalculationRecord | null): boolean =>
  Boolean(first && second)
  && first?.configVersion === second?.configVersion
  && first?.sizeMethod === second?.sizeMethod
  && first?.defaultFurnitureRoute === second?.defaultFurnitureRoute
  && first?.workingDays === second?.workingDays
  && first?.labourCost === second?.labourCost;

/**
 * The labour plan to store after an update. Frozen plans never change. A new record is added to the history
 * only when something in it changed, newest first, keeping the last 20.
 */
export const mergeStudioLabourPlan = (
  saved: StudioLabourPlan | null | undefined,
  incoming: Pick<StudioLabourPlan, "settings" | "latestRecord">,
  isFreezing: boolean
): StudioLabourPlan => {
  if (saved?.isFrozen) return saved;
  const history = saved?.history ?? [];
  const latestRecord = incoming.latestRecord ?? saved?.latestRecord ?? null;
  const nextHistory = incoming.latestRecord && !isSameRecord(history[0], incoming.latestRecord)
    ? [incoming.latestRecord, ...history].slice(0, MAXIMUM_LABOUR_PLAN_HISTORY)
    : history;
  return {
    settings: incoming.settings,
    latestRecord,
    history: nextHistory,
    isFrozen: isFreezing,
    frozenAt: isFreezing ? new Date().toISOString() : null,
  };
};

/** Freezes or unfreezes a saved plan (price lock on/off). An approved quote stays frozen. */
export const setStudioLabourPlanFrozen = (saved: StudioLabourPlan | null | undefined, isFrozen: boolean, isClientApproved: boolean): StudioLabourPlan | null => {
  if (!saved) return null;
  const shouldFreeze = isFrozen || isClientApproved;
  if (saved.isFrozen === shouldFreeze) return saved;
  return { ...saved, isFrozen: shouldFreeze, frozenAt: shouldFreeze ? new Date().toISOString() : null };
};
