import type { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../studio/studio.crmImports";
import StudioVariantModel, { VARIANT_QUOTE_NUMBER_PREFIX } from "./studioVariant.model";
import StudioModel from "../studio/studio.model";
// import { RoleBasedRequest } from "...";  // use the same import as the studio controller

const SERVER_KEYS = ["_id", "__v", "quoteNo", "createdAt", "updatedAt", "createdBy", "updatedBy", "version", "organizationId", "studioId"];
const stripServerFields = (body: Record<string, unknown>) => {
  const copy = { ...body };
  SERVER_KEYS.forEach((key) => delete copy[key]);
  return copy;
};
// Match how the studio controller reads the signed-in user's id.
const getUserId = (req: RoleBasedRequest) => (req as any).user?._id ?? null;
const fail = (res: Response, error: any, fallback: string) =>
  res.status(500).json({ ok: false, message: error?.message || fallback });

// const nextVariantQuoteNo = async (organizationId: string) => {
//   const latest = await StudioVariantModel.findOne(
//     { organizationId, quoteNo: { $regex: `^${VARIANT_QUOTE_NUMBER_PREFIX}-` } },
//     { quoteNo: 1 }
//   ).sort({ createdAt: -1 }).lean();
//   const lastNumber = latest ? Number.parseInt(latest.quoteNo.split("-")[1], 10) || 0 : 0;
//   return `${VARIANT_QUOTE_NUMBER_PREFIX}-${String(lastNumber + 1).padStart(3, "0")}`;
// };

export const createStudioVariant = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { organizationId, studioId } = req.params;
    if (!(await StudioModel.exists({ _id: studioId, organizationId }))) {
      return res.status(404).json({ ok: false, message: "Base studio not found" });
    }
    const snapshot = stripServerFields(req.body ?? {});
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await StudioVariantModel.create({
          ...snapshot, organizationId, studioId,
        //   quoteNo: await nextVariantQuoteNo(organizationId),
          createdBy: getUserId(req), updatedBy: getUserId(req),
        });
        return res.status(201).json({ ok: true, message: "Variation created", data: created });
      } catch (error: any) {
        if (error?.code !== 11000) throw error; // quote number clash: retry
        lastError = error;
      }
    }
    throw lastError;
  } catch (error) { return fail(res, error, "Could not create the variation"); }
};

export const listStudioVariants = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { organizationId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const search = String(req.query.search ?? "").trim();
    const match: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (req.query.studioId) match.studioId = new mongoose.Types.ObjectId(String(req.query.studioId));
    if (req.query.projectId) match.projectId = new mongoose.Types.ObjectId(String(req.query.projectId));
    if (req.query.status) match.status = String(req.query.status);
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ quoteNo: pattern }, { quoteName: pattern }];
    }
    const [items, totalCount] = await Promise.all([
      StudioVariantModel.aggregate([
        { $match: match }, { $sort: { updatedAt: -1 } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize },
        { $project: {
            studioId: 1, quoteNo: 1, quoteName: 1, status: 1, projectId: 1, createdAt: 1, updatedAt: 1,
            roomCount: { $size: { $ifNull: ["$rooms", []] } }, grandTotal: { $ifNull: ["$totals.grandTotal", 0] },
        } },
      ]),
      StudioVariantModel.countDocuments(match),
    ]);
    await StudioVariantModel.populate(items, { path: "projectId", select: "projectName", model: "ProjectModel" });
    const data = items.map((item: any) => ({
      ...item,
      projectName: item.projectId?.projectName ?? "",
      projectId: item.projectId?._id ?? null,
    }));
    return res.json({ ok: true, message: "OK", data: { items: data, totalCount, page, pageSize } });
  } catch (error) { return fail(res, error, "Could not load the variations"); }
};

export const getStudioVariant = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { organizationId, variantId } = req.params;
    const variant = await StudioVariantModel.findOne({ _id: variantId, organizationId });
    if (!variant) return res.status(404).json({ ok: false, message: "Variation not found" });
    return res.json({ ok: true, message: "OK", data: variant });
  } catch (error) { return fail(res, error, "Could not load the variation"); }
};

export const updateStudioVariant = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { organizationId, variantId } = req.params;
    const variant = await StudioVariantModel.findOne({ _id: variantId, organizationId });
    if (!variant) return res.status(404).json({ ok: false, message: "Variation not found" });
    if (req.body?.version !== undefined && Number(req.body.version) !== variant.version) {
      return res.status(409).json({ ok: false, message: "This variation was changed by someone else", currentVersion: variant.version });
    }
    variant.set(stripServerFields(req.body ?? {}));
    variant.version += 1;
    variant.updatedBy = getUserId(req);
    await variant.save();
    return res.json({ ok: true, message: "Variation saved", data: variant });
  } catch (error) { return fail(res, error, "Could not save the variation"); }
};

export const deleteStudioVariant = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { organizationId, variantId } = req.params;
    const deleted = await StudioVariantModel.findOneAndDelete({ _id: variantId, organizationId });
    if (!deleted) return res.status(404).json({ ok: false, message: "Variation not found" });
    return res.json({ ok: true, message: "Variation deleted", data: { variantId, quoteNo: deleted.quoteNo } });
  } catch (error) { return fail(res, error, "Could not delete the variation"); }
};





/* ------------------------- Share links ------------------------- */
import crypto  from 'crypto';
const MAXIMUM_SHARE_LINK_DAYS = Infinity
const MAXIMUM_SHARE_LINKS = Infinity 

const SHARED_HIDDEN_KEYS = ["_id", "__v", "organizationId", "studioId", "projectId", "createdBy", "updatedBy", "lock", "shareLinks", "priceLists", "studioRates", "pricingSettings", "priceLock", "quotationDetails", "floorPlan", "extraction", "importOptions"];
const PRICE_KEYS = new Set([
  "unitPrice", "totalPrice", "materialCost", "labourCost", "installationCost", "marginAmount", "labourRatePerSquareFoot",
  "furnitureTotal", "wallsTotal", "floorTotal", "ceilingTotal", "openingsTotal", "lightingTotal", "electricalTotal", "decorTotal",
  "subtotal", "adjustmentAmount", "gstAmount", "grandTotal",
]);

const zeroPrices = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(zeroPrices);
  if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId)) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, PRICE_KEYS.has(key) ? 0 : zeroPrices(inner)]));
  }
  return value;
};

/** What a visitor without a login may see: no ids, rates, margins, client details or other links. Prices are zeroed on the server when the link hides them. */
const buildSharedView = (variant: Record<string, any>, showsPrices: boolean) => {
  const visible = { ...variant };
  SHARED_HIDDEN_KEYS.forEach((key) => delete visible[key]);
  const view = { ...visible, showsPrices };
  return showsPrices ? view : zeroPrices(view);
};

export const createStudioVariantShareLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { organizationId, variantId } = req.params;
    const showsPrices = Boolean(req.body?.showsPrices);
    const days = Math.min(MAXIMUM_SHARE_LINK_DAYS, Math.max(1, Math.round(Number(req.body?.expiresInDays) || 30)));
    const variant = await StudioVariantModel.findOne({ _id: variantId, organizationId });
    if (!variant) return res.status(404).json({ ok: false, message: "Variation not found" });
    if (variant.shareLinks.length >= MAXIMUM_SHARE_LINKS) {
      return res.status(400).json({ ok: false, message: `A variation can have at most ${MAXIMUM_SHARE_LINKS} share links. Turn some off first.` });
    }
    variant.shareLinks.push({
      token: crypto.randomBytes(32).toString("base64url"),
      showsPrices,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      isRevoked: false,
      createdBy: getUserId(req),
      viewCount: 0,
    } as any);
    await variant.save();
    return res.status(201).json({ ok: true, message: "Share link created", data: variant });
  } catch (error) { return fail(res, error, "Could not create the share link"); }
};

export const revokeStudioVariantShareLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { organizationId, variantId, shareLinkId } = req.params;
    const variant = await StudioVariantModel.findOne({ _id: variantId, organizationId });
    if (!variant) return res.status(404).json({ ok: false, message: "Variation not found" });
    const shareLink = (variant.shareLinks as any).id(shareLinkId);
    if (!shareLink) return res.status(404).json({ ok: false, message: "Share link not found" });
    shareLink.isRevoked = true;
    await variant.save();
    return res.json({ ok: true, message: "Share link turned off", data: variant });
  } catch (error) { return fail(res, error, "Could not turn off the share link"); }
};

/** Public: no login. The token alone finds the variation; invalid, expired and turned-off links all get the same answer. */
export const getSharedStudioVariant = async (req: Request, res: Response): Promise<any> => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const token = String(req.params.token ?? "");
    if (token.length < 20 || token.length > 100) return res.status(404).json({ ok: false, message: "This link is not valid or has expired" });
    const variant: any = await StudioVariantModel.findOneAndUpdate(
      { shareLinks: { $elemMatch: { token, isRevoked: false, expiresAt: { $gt: new Date() } } } },
      { $inc: { "shareLinks.$.viewCount": 1 } },
      { new: true, timestamps: false }
    ).lean();
    if (!variant) return res.status(404).json({ ok: false, message: "This link is not valid or has expired" });
    const shareLink = (variant.shareLinks ?? []).find((candidate: any) => candidate.token === token);
    return res.json({ ok: true, message: "OK", data: buildSharedView(variant, Boolean(shareLink?.showsPrices)) });
  } catch {
    return res.status(500).json({ ok: false, message: "Could not open this link" });
  }
};