import { type Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import { TariffModel } from "../../models/eb_model/tariff.model";

// ============================
// GET ALL TARIFFS
// ============================



// // Wipes ONLY eb-logs related cache (logs list/by-id) — use when just an EB log changes
// // and nothing about premises/tariff changed.
// export const invalidateEBLogsCache = async (organizationId: string): Promise<void> => {
//     try {
//         await deleteByPattern(`school:${organizationId}:eblogs*`);
//     } catch (e) {
//         console.error("Redis Invalidate Error (EB Logs):", e);
//     }
// };

// // Wipes ALL derived EB data: logs, dashboard, analytics, chart, kpis.
// // This is the one to call whenever ANYTHING that feeds cost/consumption changes —
// // a log entry, a tariff's rates, or a premises' tariffId/sanctionedLoad.
// export const invalidateAllEBDerivedCache = async (organizationId: string): Promise<void> => {
//     try {
//         await Promise.all([
//             deleteByPattern(`school:${organizationId}:eblogs*`),
//             deleteByPattern(`school:${organizationId}:eb:*`), // dashboard, premisesAnalytics, chart, kpis
//         ]);
//     } catch (e) {
//         console.error("Redis Invalidate Error (EB Derived):", e);
//     }
// };

// // Wipes premises cache specifically (list + by-id)
// export const invalidatePremisesCache = async (organizationId: string, premisesId?: string): Promise<void> => {
//     try {
//         await deleteByPattern(`school:${organizationId}:premises*`);
//     } catch (e) {
//         console.error("Redis Invalidate Error (Premises):", e);
//     }
// };

// // Wipes tariff cache specifically (list + by-id)
// export const invalidateTariffCache = async (organizationId: string): Promise<void> => {
//     try {
//         await deleteByPattern(`school:${organizationId}:tariffs*`);
//     } catch (e) {
//         console.error("Redis Invalidate Error (Tariff):", e);
//     }
// };


export const getTariffs = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required" });
        }

        // const cacheKey = REDIS_KEYS.schoolTariffs(organizationId);

        // // 1. ATTEMPT CACHE READ
        // try {
        //     const cachedData = await redisClient.get(cacheKey);
        //     if (cachedData) {
        //         return res.status(200).json({ ok: true, data: JSON.parse(cachedData), message: "retrived from cache" });
        //     }
        // } catch (redisError) {
        //     console.error("Redis Get Error (Tariffs):", redisError);
        // }

        const tariffs = await TariffModel.find({ organizationId }).sort({ createdAt: -1 }).lean();

        // 3. UPDATE CACHE
        // try {
        //     await redisClient.setex(cacheKey, 3600, JSON.stringify(tariffs));
        // } catch (redisError) {
        //     console.error("Redis Set Error (Tariffs):", redisError);
        // }

        return res.status(200).json({ ok: true, data: tariffs });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// ============================
// GET TARIFF BY ID
// ============================
export const getTariffById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, tariffId } = req.params;

        if (!organizationId || !tariffId) {
            return res.status(400).json({ ok: false, message: "organizationId and tariffId are required" });
        }

        // const cacheKey = REDIS_KEYS.schoolTariffById(organizationId, tariffId);

        // try {
        //     const cachedData = await redisClient.get(cacheKey);
        //     if (cachedData) {
        //         return res.status(200).json({ ok: true, data: JSON.parse(cachedData), message: "retrived from cache" });
        //     }
        // } catch (redisError) {
        //     console.error("Redis Get Error (Tariff by id):", redisError);
        // }

        const tariff = await TariffModel.findOne({ _id: tariffId, organizationId }).lean();

        if (!tariff) {
            return res.status(404).json({ ok: false, message: "Tariff not found" });
        }

        // try {
        //     await redisClient.setex(cacheKey, 3600, JSON.stringify(tariff));
        // } catch (redisError) {
        //     console.error("Redis Set Error (Tariff by id):", redisError);
        // }

        return res.status(200).json({ ok: true, data: tariff });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

// ============================
// CREATE TARIFF
// ============================
export const createTariff = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { tariffName, fixedChargePerKw, slabs, isTelescopic } = req.body;

        if (!organizationId || !tariffName || fixedChargePerKw === undefined) {
            return res.status(400).json({ ok: false, message: "organizationId, tariffName and fixedChargePerKw are required" });
        }

        if (typeof fixedChargePerKw !== "number") {
            return res.status(400).json({ ok: false, message: "fixedChargePerKw must be a number" });
        }


        if(isTelescopic && typeof isTelescopic !=="boolean"){
            return res.status(400).json({ ok: false, message: "isTelescopic must be a boolean value" });

        }

        if (slabs !== undefined && !Array.isArray(slabs)) {
            return res.status(400).json({ ok: false, message: "slabs must be an array" });
        }

        // Duplicate check (case-insensitive) within the same school
        const existing = await TariffModel.findOne({
            organizationId,
            tariffName: { $regex: new RegExp(`^${tariffName}$`, "i") }
        });

        if (existing) {
            return res.status(400).json({ ok: false, message: "Tariff name already exists for this school" });
        }

        const newTariff = await TariffModel.create({
            organizationId,
            tariffName,
            fixedChargePerKw,
            slabs: slabs || [],
            isTelescopic,
        });

        // INVALIDATE CACHE
        // try {
        //     // await redisClient.del(REDIS_KEYS.schoolTariffs(organizationId));
        //     await invalidateTariffCache(organizationId) 
        // } catch (redisError) {
        //     console.error("Redis Del Error (Create Tariff):", redisError);
        // }

        // await createAuditLog(req, {
        //     action: "create",
        //     module: "tariff",
        //     targetId: newTariff?._id,
        //     description: `tariff created (${newTariff._id})`,
        //     status: "success"
        // });

        return res.status(201).json({ ok: true, data: newTariff });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, error: error?.message, message: "Internal server error" });
    }
};

// ============================
// UPDATE TARIFF
// ============================
export const updateTariff = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, tariffId } = req.params;
        const { tariffName, fixedChargePerKw, slabs, isActive, isTelescopic } = req.body;

        if (!organizationId || !tariffId) {
            return res.status(400).json({ ok: false, message: "organizationId and tariffId are required" });
        }

        const tariff = await TariffModel.findOne({ _id: tariffId, organizationId });

        if (!tariff) {
            return res.status(404).json({ ok: false, message: "Tariff not found" });
        }

        if (tariffName && tariffName !== tariff.tariffName) {
            const existing = await TariffModel.findOne({
                organizationId,
                _id: { $ne: tariffId },
                tariffName: { $regex: new RegExp(`^${tariffName}$`, "i") }
            });

            if (existing) {
                return res.status(400).json({ ok: false, message: "Tariff name already exists for this school" });
            }

            tariff.tariffName = tariffName;
        }

        if (fixedChargePerKw !== undefined) {
            if (typeof fixedChargePerKw !== "number") {
                return res.status(400).json({ ok: false, message: "fixedChargePerKw must be a number" });
            }
            tariff.fixedChargePerKw = fixedChargePerKw;
        }

        if (slabs !== undefined) {
            if (!Array.isArray(slabs)) {
                return res.status(400).json({ ok: false, message: "slabs must be an array" });
            }
            tariff.slabs = slabs;
        }

        if (typeof isActive === "boolean") {
            tariff.isActive = isActive;
        }


         if (typeof isTelescopic === "boolean") {
            tariff.isTelescopic = isTelescopic;
        }

        await tariff.save();

        // INVALIDATE CACHE
        // try {
        //     // await redisClient.del(REDIS_KEYS.schoolTariffs(organizationId));
        //     // await redisClient.del(REDIS_KEYS.schoolTariffById(organizationId, tariffId));

        //       await invalidateTariffCache(organizationId) 
        //     await invalidateAllEBDerivedCache(organizationId);
        // } catch (redisError) {
        //     console.error("Redis Del Error (Update Tariff):", redisError);
        // }

        // await createAuditLog(req, {
        //     action: "update",
        //     module: "tariff",
        //     targetId: tariff._id,
        //     description: `tariff updated (${tariff._id})`,
        //     status: "success"
        // });

        return res.status(200).json({ ok: true, data: tariff });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, error: error?.message, message: "Internal server error" });
    }
};

// ============================
// DELETE TARIFF (single)
// ============================
export const deleteTariff = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, tariffId } = req.params;

        if (!organizationId || !tariffId) {
            return res.status(400).json({ ok: false, message: "organizationId and tariffId are required" });
        }

        const tariff = await TariffModel.findOneAndDelete({ _id: tariffId, organizationId });

        if (!tariff) {
            return res.status(404).json({ ok: false, message: "Tariff not found" });
        }

        // INVALIDATE CACHE
        // try {
        //     // await redisClient.del(REDIS_KEYS.schoolTariffs(organizationId));
        //     // await redisClient.del(REDIS_KEYS.schoolTariffById(organizationId, tariffId));

        //      await invalidateTariffCache(organizationId) 
        //     await invalidateAllEBDerivedCache(organizationId);
        // } catch (redisError) {
        //     console.error("Redis Del Error (Delete Tariff):", redisError);
        // }

        // await createAuditLog(req, {
        //     action: "delete",
        //     module: "tariff",
        //     targetId: tariff._id,
        //     description: `tariff deleted (${tariff._id})`,
        //     status: "success"
        // });


        // await archiveData({
        //     organizationId: tariff.organizationId,
        //     category: "tariff",
        //     originalId: tariff._id,
        //     deletedData: tariff.toObject(), // Convert Mongoose doc to plain object
        //     deletedBy: req.user!._id || null,
        //     reason: null, // Optional reason from body
        // });


        return res.status(200).json({ ok: true, message: "Tariff deleted successfully" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};