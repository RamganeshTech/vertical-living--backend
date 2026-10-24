import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { MetaAdAccountModel } from '../../../models/marketing_models/lead_model/metaAdSetting_model/metaAdSetting.model';

// Limit is enforced in code (not by an index) so it is easy to change later.
const MAX_META_AD_ACCOUNTS_PER_ORG = 2;

const PLAIN_FIELDS = ['facebookPageId', 'metaAdAccountId', 'metaDatasetId'] as const;
const SECRET_FIELDS = ['metaAccessToken', 'metaVerifyToken', 'metaDatasetToken'] as const;

// Secret fields are `select: false` in the schema, so opt in when we need them.
const WITH_SECRETS = '+metaAccessToken +metaVerifyToken +metaDatasetToken';

// ---- helpers -------------------------------------------------------------

// Adapt this to however your auth middleware exposes the organization.
// const getOrganizationId = (req: Request): string | undefined =>
//    req.params.organizationId.toString()
//   // (req as any).user?.organizationId?.toString();

const getOrganizationId = (req: Request): string | undefined => {
  const organizationId =
    req.params.organizationId ?? req.body?.organizationId;

  return typeof organizationId === "string" && organizationId.trim()
    ? organizationId.trim()
    : undefined;
};

// string -> trimmed string | null (empty clears it); anything else -> undefined (skip)
const clean = (v: unknown): string | null | undefined => {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  return v.trim() || null;
};

// "1234567890" -> "act_1234567890"; already-prefixed values pass through
const normalizeAdAccountId = (v: unknown): string | null | undefined => {
  const c = clean(v);
  if (!c) return c;
  return /^\d+$/.test(c) ? `act_${c}` : c;
};

// Never send raw tokens to the client, only whether they are set.
const toResponse = (doc: any) => {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { metaAccessToken, metaVerifyToken, metaDatasetToken, ...rest } = obj;
  return {
    ...rest,
    hasAccessToken: !!metaAccessToken,
    hasVerifyToken: !!metaVerifyToken,
    hasDatasetToken: !!metaDatasetToken,
  };
};

// ---- controllers ---------------------------------------------------------

// GET /meta-ad-settings
export const getAllMetaAdAccounts = async (req: Request, res: Response):Promise<any> => {
  try {
    const organizationId = getOrganizationId(req);
    if (!organizationId) return res.status(401).json({ ok: false, message: 'organizationId is required' });

    const docs = await MetaAdAccountModel.find({ organizationId })
      .select(WITH_SECRETS)
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ ok: true, data: docs.map(toResponse) });
  } catch (error) {
    console.error('getAllMetaAdAccountModels error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to fetch Meta ad settings' });
  }
};

// GET /meta-ad-settings/:id
export const getMetaAdAccountByOrgId = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const organizationId = req.params.organizationId;

    if (!organizationId) {
      res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
      return;
    }

    const accounts = await MetaAdAccountModel.find({
      organizationId,
    })
      .select(WITH_SECRETS)
      .lean();

    res.status(200).json({
      ok: true,
      data: accounts.map(toResponse),
    });
  } catch (error) {
   console.error('getAllMetaAdAccountModels error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to fetch Meta ad settings' });
  
  }
};



// GET /meta-ad-settings/:id
export const getMetaAdAccountById = async (req: Request, res: Response):Promise<any> => {
  try {
    const organizationId = getOrganizationId(req);
    if (!organizationId) return res.status(401).json({ ok: false, message: 'organizationId is required' });

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const doc = await MetaAdAccountModel.findOne({ _id: id, organizationId }).select(WITH_SECRETS).lean();
    if (!doc) return res.status(404).json({ ok: false, message: 'Meta ad setting not found' });

    return res.json({ ok: true, data: toResponse(doc) });
  } catch (error) {
    console.error('getMetaAdAccountModelById error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to fetch Meta ad setting' });
  }
};

// // PUT /meta-ad-settings        -> match by metaAdAccountId, else create
// // PUT /meta-ad-settings/:id    -> update that specific record
// export const upsertMetaAdAccount = async (req: Request, res: Response):Promise<any> => {
//   try {
//     const organizationId = getOrganizationId(req);
//     if (!organizationId) return res.status(401).json({ ok: false, message: 'organizationId is required' });

//     const body = req.body ?? {};
//     const id = req.params.id ?? body.id;
//     const adAccountId = normalizeAdAccountId(body.metaAdAccountId);

//     // 1. Find the existing record, if any
//     let doc: any = null;

//     if (id) {
//       if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });
//       doc = await MetaAdAccountModel.findOne({ _id: id, organizationId }).select(WITH_SECRETS);
//       if (!doc) return res.status(404).json({ ok: false, message: 'Meta ad setting not found' });
//     } else if (adAccountId) {
//       doc = await MetaAdAccountModel.findOne({ organizationId, metaAdAccountId: adAccountId }).select(WITH_SECRETS);
//     }

//     // 2. Creating: enforce the per-organization limit
//     if (!doc) {
//       const count = await MetaAdAccountModel.countDocuments({ organizationId });
//       if (count >= MAX_META_AD_ACCOUNTS_PER_ORG) {
//         return res.status(409).json({
//           ok: false,
//           message: `An organization can have at most ${MAX_META_AD_ACCOUNTS_PER_ORG} Meta ad accounts`,
//         });
//       }
//       doc = new MetaAdAccountModel({ organizationId });
//     }

//     // 3. The same ad account must not appear twice in one organization
//     if (adAccountId) {
//       const duplicate = await MetaAdAccountModel.exists({
//         organizationId,
//         metaAdAccountId: adAccountId,
//         ...(doc._id ? { _id: { $ne: doc._id } } : {}),
//       });
//       if (duplicate) {
//         return res.status(409).json({
//           ok: false,
//           message: 'This Meta ad account is already added for this organization',
//         });
//       }
//     }

//     // 4. Apply changes
//     for (const field of PLAIN_FIELDS) {
//       const value = field === 'metaAdAccountId' ? adAccountId : clean(body[field]);
//       if (value !== undefined) doc.set(field, value);
//     }
//     // Secrets: blank/missing means "keep the current value", so the UI can
//     // leave them empty on edit without wiping the stored token.
//     for (const field of SECRET_FIELDS) {
//       const value = clean(body[field]);
//       if (value) doc.set(field, value);
//     }

//     await doc.save(); // runs the act_<digits> validator

//     return res.json({ ok: true, data: toResponse(doc) });
//   } catch (error: any) {
//     if (error?.name === 'ValidationError') {
//       return res.status(400).json({ ok: false, message: error.message });
//     }
//     console.error('upsertMetaAdAccountModel error:', error);
//     return res.status(500).json({ ok: false, message: 'Failed to save Meta ad setting' });
//   }
// };


export const upsertMetaAdAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const body = req.body ?? {};
    const id = req.params.id ?? body.id;

    // Normalize Meta ad account ID, retaining the act_ prefix
    const adAccountId = normalizeAdAccountId(body.metaAdAccountId);

    // 1. Find an existing record
    let doc: any = null;

    if (id) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid id",
        });
      }

      doc = await MetaAdAccountModel.findOne({  _id: id,  organizationId, })
      .select(WITH_SECRETS);

      if (!doc) {
        return res.status(404).json({  ok: false,  message: "Meta ad setting not found",
        });
      }
    } else if (adAccountId) {
      doc = await MetaAdAccountModel.findOne({
        organizationId,
        metaAdAccountId: adAccountId,
      }).select(WITH_SECRETS);
    }

    // 2. Create a new record if no existing record was found
    if (!doc) {
      const count = await MetaAdAccountModel.countDocuments({
        organizationId,
      });

      if (count >= MAX_META_AD_ACCOUNTS_PER_ORG) {
        return res.status(409).json({
          ok: false,
          message: `An organization can have at most ${MAX_META_AD_ACCOUNTS_PER_ORG} Meta ad accounts`,
        });
      }

      doc = new MetaAdAccountModel({ organizationId });
    }

    // 3. Prevent duplicate Meta ad account IDs within this organization
    if (adAccountId) {
      const duplicate = await MetaAdAccountModel.exists({
        organizationId,
        metaAdAccountId: adAccountId,
        ...(doc._id ? { _id: { $ne: doc._id } } : {}),
      });

      if (duplicate) {
        return res.status(409).json({
          ok: false,
          message:
            "This Meta ad account is already added for this organization",
        });
      }
    }

    // 4. Update every supported field when it is present in the request.
    // Missing fields remain unchanged; explicit null values clear nullable fields.
    const fields = [
      "accountName",
      "facebookPageId",
      "metaAdAccountId",
      "metaAccessToken",
      "metaVerifyToken",
      "metaDatasetId",
      "metaDatasetToken",
    ] as const;

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const value =
          field === "metaAdAccountId"
            ? adAccountId
            : body[field];

        doc.set(field, value);
      }
    }

    await doc.save();

    return res.status(200).json({
      ok: true,
      data: toResponse(doc),
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }

    console.error("upsertMetaAdAccountModel error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to save Meta ad setting",
    });
  }
};


// DELETE /meta-ad-settings/:id
export const deleteMetaAdAccount = async (req: Request, res: Response):Promise<any>  => {
  try {
    const organizationId = getOrganizationId(req);
    if (!organizationId) return res.status(401).json({ ok: false, message: 'organizationId is required' });

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const deleted = await MetaAdAccountModel.findOneAndDelete({ _id: id, organizationId });
    if (!deleted) return res.status(404).json({ ok: false, message: 'Meta ad setting not found' });

    return res.json({ ok: true, message: 'Meta ad setting deleted' });
  } catch (error) {
    console.error('deleteMetaAdAccountModel error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to delete Meta ad setting' });
  }
};


export const deleteMetaAdAccountByOrgId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId || !isValidObjectId(organizationId)) {
      return res.status(400).json({
        ok: false,
        message: "Valid organizationId is required",
      });
    }

    const deleted = await MetaAdAccountModel.findOneAndDelete({
      organizationId,
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Meta ad setting not found",
      });
    }

    return res.json({
      ok: true,
      message: "Meta ad settings deleted successfully",
    });
  } catch (error) {
    console.error("deleteMetaAdAccountByOrgId error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to delete Meta ad settings",
    });
  }
};

// ---- internal helper (not a route) --------------------------------------
// Use this wherever the server itself needs the real tokens (Graph API calls,
// webhook handling). Pass metaAdAccountId to pick one of the org's accounts.
export const getMetaCredentials = async (organizationId: string, metaAdAccountId?: string) =>
  MetaAdAccountModel.findOne({
    organizationId,
    ...(metaAdAccountId ? { metaAdAccountId } : {}),
  })
    .select(WITH_SECRETS)
    .lean();