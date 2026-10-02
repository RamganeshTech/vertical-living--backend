import { Response } from "express";
import mongoose from "mongoose";
import { ITariff } from "../../models/eb_model/tariff.model";
import EBLogModel from "../../models/eb_model/ebLog.model";
import { RoleBasedRequest } from "../../types/types";
import { PremisesModel } from "../../models/eb_model/premises.model";
import { getPremisesTariffContext } from "./ebLog.controller";

// ⚠️ Adjust these import paths to match your project


// =====================================================================
// TYPES
// =====================================================================

type PeriodType = "week" | "month" | "year" | "custom";

interface ResolvedPeriod {
    type: PeriodType;
    fromDate: string; // YYYY-MM-DD (IST)
    toDate: string;   // YYYY-MM-DD (IST)
    start: Date;      // IST start of fromDate
    end: Date;        // IST end of toDate
    label: string;
    days: number;
}

type UsageStatus =
    | "ok"
    | "no_readings_in_period"      // no log inside the period -> unknown, not zero
    | "insufficient_readings"      // only one reading and no earlier baseline
    | "invalid_or_meter_reset"     // end reading lower than start reading
    | "no_tariff";                 // kWh known but no tariff to price it

interface PremisesPeriodUsage {
    kwUsed: number | null;
    startReading: number | null;
    endReading: number | null;
    readingStartDate: Date | null;
    readingEndDate: Date | null;
    status: UsageStatus;
}

export interface PeriodBillBreakdown {
    unitsCost: number;
    fixedCost: number;
    totalCost: number;
    billingMode: "telescopic" | "flat";
    ratePerUnit: number | null; // flat: the rate used. telescopic: effective average rate
}

// =====================================================================
// DATE HELPERS (all boundaries are in IST, independent of server timezone)
// =====================================================================

const IST_OFFSET_MS = 330 * 60 * 1000;
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CUSTOM_RANGE_DAYS = 1830; // ~5 years
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const round2 = (n: number): number => Math.round(n * 100) / 100;
const pad2 = (n: number): string => String(n).padStart(2, "0");

const todayIstYmd = (): string => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

const isValidYmd = (s: string): boolean => {
    if (!YMD_REGEX.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const addDaysYmd = (ymd: string, days: number): string => {
    const d = new Date(`${ymd}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

const istStartOfDay = (ymd: string): Date => new Date(`${ymd}T00:00:00.000+05:30`);
const istEndOfDay = (ymd: string): Date => new Date(`${ymd}T23:59:59.999+05:30`);

const daysBetweenInclusive = (fromYmd: string, toYmd: string): number => {
    const a = new Date(`${fromYmd}T00:00:00Z`).getTime();
    const b = new Date(`${toYmd}T00:00:00Z`).getTime();
    return Math.round((b - a) / 86400000) + 1;
};

// How many "billing months" the period covers. Full calendar month = 1, full year = 12,
// partial months are counted as (days covered / days in that month).
// Used to prorate the fixed charge and to scale telescopic slab limits.
const billingMonthsInRange = (fromYmd: string, toYmd: string): number => {
    const end = new Date(`${toYmd}T00:00:00Z`);
    let cursor = new Date(`${fromYmd}T00:00:00Z`);
    let total = 0;

    while (cursor.getTime() <= end.getTime()) {
        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth();
        const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const monthEnd = new Date(Date.UTC(y, m, daysInMonth));
        const segmentEnd = monthEnd.getTime() < end.getTime() ? monthEnd : end;
        const daysCovered = Math.round((segmentEnd.getTime() - cursor.getTime()) / 86400000) + 1;
        total += daysCovered / daysInMonth;
        cursor = new Date(Date.UTC(y, m + 1, 1));
    }
    return total;
};

// Resolves ?period=week|month|year|custom (+ its params) into concrete IST boundaries
const resolveEbPeriod = (
    q: Record<string, string | undefined>
): { period?: ResolvedPeriod; error?: string } => {
    const type = (q.period ?? "month") as PeriodType;
    const today = todayIstYmd();
    let fromDate: string;
    let toDate: string;
    let label: string;

    switch (type) {
        case "week": {
            // Monday–Sunday week containing `date` (defaults to today)
            const anchor = q.date ?? today;
            if (!isValidYmd(anchor)) return { error: "date must be a valid YYYY-MM-DD" };
            const dow = new Date(`${anchor}T00:00:00Z`).getUTCDay(); // 0 = Sunday
            fromDate = addDaysYmd(anchor, -((dow + 6) % 7));
            toDate = addDaysYmd(fromDate, 6);
            label = `Week ${fromDate} to ${toDate}`;
            break;
        }
        case "month": {
            const y = q.year ? parseInt(q.year, 10) : parseInt(today.slice(0, 4), 10);
            const m = q.month ? parseInt(q.month, 10) : parseInt(today.slice(5, 7), 10);
            if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
                return { error: "year must be a number and month must be 1-12" };
            }
            const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
            fromDate = `${y}-${pad2(m)}-01`;
            toDate = `${y}-${pad2(m)}-${pad2(lastDay)}`;
            label = `${MONTH_NAMES[m - 1]} ${y}`;
            break;
        }
        case "year": {
            const y = q.year ? parseInt(q.year, 10) : parseInt(today.slice(0, 4), 10);
            if (Number.isNaN(y)) return { error: "year must be a number" };
            fromDate = `${y}-01-01`;
            toDate = `${y}-12-31`;
            label = `${y}`;
            break;
        }
        case "custom": {
            if (!q.from || !q.to) return { error: "from and to (YYYY-MM-DD) are required for period=custom" };
            if (!isValidYmd(q.from) || !isValidYmd(q.to)) return { error: "from and to must be valid YYYY-MM-DD" };
            if (q.from > q.to) return { error: "from cannot be after to" };
            if (daysBetweenInclusive(q.from, q.to) > MAX_CUSTOM_RANGE_DAYS) {
                return { error: `custom range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days` };
            }
            fromDate = q.from;
            toDate = q.to;
            label = `${fromDate} to ${toDate}`;
            break;
        }
        default:
            return { error: "period must be one of: week, month, year, custom" };
    }

    return {
        period: {
            type,
            fromDate,
            toDate,
            start: istStartOfDay(fromDate),
            end: istEndOfDay(toDate),
            label,
            days: daysBetweenInclusive(fromDate, toDate),
        },
    };
};

// =====================================================================
// BILL CALCULATION (new, period-aware — the old calculateBillAmount is untouched)
//
// isTelescopic = true  -> slab-wise: each slab's units are charged at that slab's rate
// isTelescopic = false -> flat: ALL units charged at one rate (the slab the total falls in;
//                         with a single slab / upto = null this is simply "₹X per unit")
//
// Slab limits are defined per billing month. For periods longer/shorter than a month the
// limits are scaled by `billingMonths` (week ≈ 0.23, year = 12) so a year of usage is not
// pushed into the top slab unfairly.
// Fixed charge = sanctionedLoad × fixedChargePerKw per month, prorated by `billingMonths`.
// =====================================================================

export const calculatePeriodBillBreakdown = (
    unitsConsumed: number,
    tariff: Pick<ITariff, "slabs" | "fixedChargePerKw" | "isTelescopic">,
    sanctionedLoad: number,
    billingMonths: number,
    includeFixedCharge: boolean
): PeriodBillBreakdown => {
    const scale = billingMonths > 0 ? billingMonths : 1;

    // upto = null means "no upper limit", so it sorts last
    const slabs = [...(tariff.slabs ?? [])].sort(
        (a, b) => (a.upto ?? Number.POSITIVE_INFINITY) - (b.upto ?? Number.POSITIVE_INFINITY)
    );
    const lastSlab = slabs[slabs.length - 1];

    let unitsCost = 0;
    let ratePerUnit: number | null = null;
    const billingMode: "telescopic" | "flat" = tariff.isTelescopic ? "telescopic" : "flat";

    if (tariff.isTelescopic) {
        let remaining = unitsConsumed;
        let previousUpto = 0;

        for (const slab of slabs) {
            if (remaining <= 0) break;
            const scaledUpto = slab.upto === null ? null : slab.upto * scale;
            const capacity = scaledUpto === null ? remaining : Math.max(scaledUpto - previousUpto, 0);
            const unitsInSlab = Math.min(remaining, capacity);
            unitsCost += unitsInSlab * slab.ratePerUnit;
            remaining -= unitsInSlab;
            if (scaledUpto !== null) previousUpto = scaledUpto;
        }

        // safety net: slabs configured without an open-ended last slab
        if (remaining > 0 && lastSlab) unitsCost += remaining * lastSlab.ratePerUnit;

        ratePerUnit = unitsConsumed > 0 ? unitsCost / unitsConsumed : null;
    } else {
        const matched =
            slabs.find((s) => s.upto === null || unitsConsumed <= s.upto * scale) ?? lastSlab;
        ratePerUnit = matched ? matched.ratePerUnit : null;
        unitsCost = matched ? unitsConsumed * matched.ratePerUnit : 0;
    }

    const monthlyFixed = (sanctionedLoad || 0) * (tariff.fixedChargePerKw || 0);
    const fixedCost = includeFixedCharge ? monthlyFixed * billingMonths : 0;

    return {
        unitsCost: round2(unitsCost),
        fixedCost: round2(fixedCost),
        totalCost: round2(unitsCost + fixedCost),
        billingMode,
        ratePerUnit: ratePerUnit === null ? null : round2(ratePerUnit),
    };
};

// =====================================================================
// CONSUMPTION FOR ONE PREMISES OVER ONE PERIOD
// start reading = last reading BEFORE the period (baseline).
//                 If none exists, falls back to the first reading inside the period.
// end reading   = last reading ON OR BEFORE the end of the period.
// =====================================================================

const computePremisesPeriodUsage = async (
    organizationId: string,
    premisesId: string,
    start: Date,
    end: Date
): Promise<PremisesPeriodUsage> => {
    const empty = (status: UsageStatus): PremisesPeriodUsage => ({
        kwUsed: null,
        startReading: null,
        endReading: null,
        readingStartDate: null,
        readingEndDate: null,
        status,
    });

    const endLog = await EBLogModel.findOne({ organizationId, premisesId, date: { $lte: end } })
        .sort({ date: -1, time: -1 })
        .lean();

    // no reading at all, or the latest reading is older than the period -> nothing recorded in it
    if (!endLog || endLog.date < start) return empty("no_readings_in_period");

    let startLog = await EBLogModel.findOne({ organizationId, premisesId, date: { $lt: start } })
        .sort({ date: -1, time: -1 })
        .lean();

    if (!startLog) {
        startLog = await EBLogModel.findOne({ organizationId, premisesId, date: { $gte: start, $lte: end } })
            .sort({ date: 1, time: 1 })
            .lean();
    }

    if (!startLog || String(startLog._id) === String(endLog._id)) {
        return { ...empty("insufficient_readings"), endReading: endLog.meterReading, readingEndDate: endLog.date };
    }

    const diff = endLog.meterReading - startLog.meterReading;
    if (diff < 0) {
        return {
            ...empty("invalid_or_meter_reset"),
            startReading: startLog.meterReading,
            endReading: endLog.meterReading,
            readingStartDate: startLog.date,
            readingEndDate: endLog.date,
        };
    }

    return {
        kwUsed: round2(diff),
        startReading: startLog.meterReading,
        endReading: endLog.meterReading,
        readingStartDate: startLog.date,
        readingEndDate: endLog.date,
        status: "ok",
    };
};

// =====================================================================
// CONTROLLER
// GET /:organizationId/premises-comparison
//
// Query params:
//   period            week | month | year | custom            (default: month)
//   date              YYYY-MM-DD, any day inside the week      (period=week, default today)
//   year, month       numbers                                  (period=month; period=year uses year)
//   from, to          YYYY-MM-DD                               (period=custom)
//   premisesIds       comma separated ids                      (optional, default: ALL premises)
//   sortBy            cost | kwUsed | name                     (default: cost)
//   includeFixedCharge true | false                            (default: true)
// =====================================================================

export const getPremisesConsumptionCostComparison = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const query = req.query as Record<string, string | undefined>;
        const { premisesIds, sortBy = "cost", includeFixedCharge = "true" } = query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required" });
        }

        const { period, error } = resolveEbPeriod(query);
        if (!period) {
            return res.status(400).json({ ok: false, message: error });
        }

        if (!["cost", "kwUsed", "name"].includes(sortBy)) {
            return res.status(400).json({ ok: false, message: "sortBy must be one of: cost, kwUsed, name" });
        }

        const premisesFilter: Record<string, any> = { organizationId };
        if (premisesIds) {
            const ids = premisesIds.split(",").map((s) => s.trim()).filter(Boolean);
            if (ids.some((id) => !mongoose.isValidObjectId(id))) {
                return res.status(400).json({ ok: false, message: "premisesIds contains an invalid id" });
            }
            premisesFilter._id = { $in: ids };
        }

        const premisesList = await PremisesModel.find(premisesFilter).lean();

        const billingMonths = billingMonthsInRange(period.fromDate, period.toDate);
        const withFixed = includeFixedCharge !== "false";

        const rows = await Promise.all(
            premisesList.map(async (p: any) => {
                const premisesId = String(p._id);
                // ⚠️ adjust to your PremisesModel's name field
                const premisesName: string = p.premisesName ?? p.name ?? "Unnamed premises";

                const [usage, tariffContext] = await Promise.all([
                    computePremisesPeriodUsage(organizationId, premisesId, period.start, period.end),
                    getPremisesTariffContext(organizationId, premisesId),
                ]);

                const tariff = tariffContext?.tariff ?? null;
                const sanctionedLoad = tariffContext?.sanctionedLoad ?? 0;

                let breakdown: PeriodBillBreakdown | null = null;
                let status: UsageStatus = usage.status;

                if (usage.kwUsed !== null) {
                    if (tariff) {
                        breakdown = calculatePeriodBillBreakdown(
                            usage.kwUsed,
                            tariff,
                            sanctionedLoad,
                            billingMonths,
                            withFixed
                        );
                    } else {
                        status = "no_tariff";
                    }
                }

                return {
                    premisesId,
                    premisesName,
                    kwUsed: usage.kwUsed,
                    cost: breakdown ? breakdown.totalCost : null,
                    unitsCost: breakdown ? breakdown.unitsCost : null,
                    fixedCost: breakdown ? breakdown.fixedCost : null,
                    ratePerUnit: breakdown ? breakdown.ratePerUnit : null,
                    billingMode: breakdown ? breakdown.billingMode : null,
                    sanctionedLoad,
                    startReading: usage.startReading,
                    endReading: usage.endReading,
                    readingStartDate: usage.readingStartDate,
                    readingEndDate: usage.readingEndDate,
                    status,
                };
            })
        );

        // sort: nulls always last
        rows.sort((a, b) => {
            if (sortBy === "name") return a.premisesName.localeCompare(b.premisesName);
            const av = sortBy === "kwUsed" ? a.kwUsed : a.cost;
            const bv = sortBy === "kwUsed" ? b.kwUsed : b.cost;
            if (av === null && bv === null) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            return bv - av;
        });

        const totalKwUsed = round2(rows.reduce((s, r) => s + (r.kwUsed ?? 0), 0));
        const totalCost = round2(rows.reduce((s, r) => s + (r.cost ?? 0), 0));

        return res.status(200).json({
            ok: true,
            data: {
                period: {
                    type: period.type,
                    label: period.label,
                    from: period.fromDate,
                    to: period.toDate,
                    days: period.days,
                    billingMonths: round2(billingMonths),
                    includesFixedCharge: withFixed,
                },
                // ready for a bar chart: same order as `premises`
                chart: {
                    labels: rows.map((r) => r.premisesName),
                    kwUsed: rows.map((r) => r.kwUsed),
                    cost: rows.map((r) => r.cost),
                },
                premises: rows,
                totals: {
                    kwUsed: totalKwUsed,
                    cost: totalCost,
                    premisesCount: rows.length,
                    premisesWithData: rows.filter((r) => r.status === "ok").length,
                },
            },
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// =====================================================================
// ROUTE (add next to your existing EB routes, use the same auth/role middleware):
//
// router.get("/:organizationId/premises-comparison", <sameAuthMiddleware>, getPremisesConsumptionCostComparison);
// =====================================================================