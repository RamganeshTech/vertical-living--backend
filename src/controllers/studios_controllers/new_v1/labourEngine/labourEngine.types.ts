// labourEngine.types.ts
/**
 * Backend shapes for the Labour Engine. The engine itself runs in the browser; the backend only stores
 * the firm's settings (with change history) and each studio's labour plan record.
 */
import type { Types } from "mongoose";

/** The settings object as the browser sends it. Checked by parseLabourEngineConfig before saving. */
export type LabourEngineConfigData = Record<string, unknown> & {
  schema: "vl.labourEngine.config";
  version: number;
  trades: Record<string, unknown>[];
  norms: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  stages: Record<string, unknown>[];
};

export interface LabourEngineChangeEntry {
  version: number;
  changedAt: Date;
  changedBy: Types.ObjectId | null;
  changedByRole: string;
  summary: string;
  /** The full settings as they were after this change, so any version can be looked at or restored. */
  // config: LabourEngineConfigData;
}

/** One settings record for the whole firm (answer F5). */
export interface ILabourEngineSettings {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  version: number;
  config: LabourEngineConfigData;
  history: LabourEngineChangeEntry[];
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FurnitureBuildRoute = "site" | "factory";

export interface LabourPlanSettings {
  siteFactorPercentage: number;
  crewOverrides: Record<string, number>;
  moduleRoutes: Record<string, FurnitureBuildRoute>;
  startDate: string | null;
  targetDays: number | null;
}

export interface LabourCalculationRecord {
  calculatedAt: string;
  configVersion: number;
  sizeMethod: "rft" | "stepped" | "fixed";
  sizeMethodName: string;
  defaultFurnitureRoute: FurnitureBuildRoute;
  workingDays: number;
  skilledManDays: number;
  helperDays: number;
  labourCost: number;
  moduleLabourCost: number;
  sizedUnitCount: number;
  sizedHoursMethodA: number;
  sizedHoursMethodB: number;
  sizedHoursFixed: number;
}

/** Stored on the studio as studio.labourPlan (answer F1: kept in the studio document, no extra collection). */
export interface StudioLabourPlan {
  settings: LabourPlanSettings;
  latestRecord: LabourCalculationRecord | null;
  history: LabourCalculationRecord[];
  isFrozen: boolean;
  frozenAt: string | null;
}
