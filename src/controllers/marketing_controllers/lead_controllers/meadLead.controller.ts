// const crypto = require('crypto');
import crypto from 'crypto';
import axios from 'axios';
import { Request, Response } from 'express';
import { MetaAdLeadModel } from '../../../models/marketing_models/lead_model/metaAdLead_model/metaAdLead.model';
import OrganizationModel from '../../../models/organization models/organization.model';
import { isValidObjectId } from 'mongoose';
import { MetaAdAccountModel } from '../../../models/marketing_models/lead_model/metaAdSetting_model/metaAdSetting.model';
// const axios = require('axios');

// Helper to hash data (Meta requirement)
const sha256 = (data: any) => crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');

async function sendCapiUpdate({
    leadEmail,
    leadPhone,
    eventName,
    metaLeadId,
    datasetId,     // <-- NEW
    datasetToken   // <-- NEW
}: {
    leadEmail: string,
    leadPhone: string,
    eventName: string,
    metaLeadId: string,
    datasetId: string,     // <-- NEW
    datasetToken: string   // <-- NEW
}) {
    // Safety check: If the tenant hasn't set up CAPI yet, just exit silently
    if (!datasetId || !datasetToken) {
        console.log("CAPI Update Skipped: Organization has not configured Dataset ID/Token.");
        return;
    }

    const payload = {
        data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "system_generated",
            user_data: {
                em: [sha256(leadEmail)],
                ph: [sha256(leadPhone)],
                lead_id: metaLeadId
            }
        }]
    };

    try {
        // Use the tenant's dynamic ID and Token
        await axios.post(`https://graph.facebook.com/v25.0/${datasetId}/events?access_token=${datasetToken}`, payload);
        console.log("Status update sent to Meta successfully");
    } catch (error: any) {
        console.error("Error sending Capi update:", error.response?.data || error.message);
    }
}


// Meta uses this to verify your webhook URL
export const verifyMetaWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Get the ID from the URL (e.g., /webhook/65a1b2c3d4e5f)
        const { organizationId } = req.params;

        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'];

        // 2. Look up the organization in the database
        const organization = await OrganizationModel.findById(organizationId);

        if (!organization) {
            console.error(`Verification Failed: No organization found for ID ${organizationId}`);
            return res.sendStatus(404);
        }

        // 3. Check if the tenant actually saved a verify token
        if (!organization.metaVerifyToken) {
            console.error(`Verification Failed: Org ${organizationId} has no metaVerifyToken saved`);
            return res.sendStatus(400);
        }

        // 4. Compare Meta's token with the Database token
        if (mode && token) {
            if (mode === 'subscribe' && token === organization.metaVerifyToken) {
                console.log(`WEBHOOK_VERIFIED for Organization: ${organizationId}`);
                return res.status(200).send(challenge);
            } else {
                return res.sendStatus(403); // Token mismatch
            }
        }

        return res.sendStatus(400);
    } catch (error) {
        console.error("Webhook Verification Error:", error);
        return res.sendStatus(500);
    }
};


export const MetaWebhookforAd = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadId = change.value.leadgen_id;
                        const pageId = change.value.page_id; // The ID of the Facebook Page that got the lead

                        // --- CHANGE 1: Search using your exact schema field name ---
                        const organization = await OrganizationModel.findOne({ facebookPageId: pageId });

                        if (!organization) {
                            console.error(`Webhook Ignored: No organization found for Facebook Page ID: ${pageId}`);
                            continue; // Skip if this page doesn't belong to any of your tenants
                        }

                        // Safety check: Ensure the tenant actually saved their token
                        if (!organization.metaAccessToken) {
                            console.error(`Webhook Failed: Organization ${organization._id} is missing their metaAccessToken`);
                            continue;
                        }

                        // --- CHANGE 2: Use the tenant's specific token, NOT process.env ---
                        const response = await axios.get(
                            `https://graph.facebook.com/v25.0/${leadId}?access_token=${organization.metaAccessToken}`
                        );

                        // Map the field_data into a single object for your Map schema
                        const dynamicFormFields = response.data.field_data.reduce((acc: any, item: any) => {
                            acc[item.name] = item.values[0];
                            return acc;
                        }, {});

                        // Save to your database under the correct tenant
                        await MetaAdLeadModel.create({
                            organizationId: organization._id,
                            metaLeadId: leadId,
                            formFields: dynamicFormFields,
                            adId: change.value.ad_id,
                            formName: "Meta Lead Form",
                            status: "New"
                        });
                    }
                }
            }
        }

        // Always return 200 OK to Meta immediately, regardless of what happens
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(200).send('EVENT_RECEIVED');
    }
};



const WITH_SECRETS = '+metaAccessToken +metaVerifyToken +metaDatasetToken';

const resolveMetaAccount = async (req: Request) => {
    const { accountId, organizationId } = req.params;

    if (accountId) {
        if (!isValidObjectId(accountId)) return null;
        return MetaAdAccountModel.findById(accountId).select(WITH_SECRETS);
    }

    // Legacy URL: /webhook/:organizationId -> the org's first account
    if (organizationId && isValidObjectId(organizationId)) {
        return MetaAdAccountModel.findOne({ organizationId }).sort({ createdAt: 1 }).select(WITH_SECRETS);
    }
    return null;
};

// Meta uses this to verify your webhook URL
export const verifyMetaWebhookV1 = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Get the ID from the URL (e.g., /webhook/65a1b2c3d4e5f)
        const { accountId } = req.params;

        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'];

        // 2. Look up the organization in the database
        // const organization = await OrganizationModel.findById(organizationId);

        const account = await resolveMetaAccount(req)

        if (!account) {
            console.error(`Verification Failed: No account found for ID ${accountId}`);
            return res.sendStatus(404);
        }

        // 3. Check if the tenant actually saved a verify token
        if (!account.metaVerifyToken) {
            console.error(`Verification Failed: account ${accountId} has no metaVerifyToken saved`);
            return res.sendStatus(400);
        }

        // 4. Compare Meta's token with the Database token
        if (mode && token) {
            if (mode === 'subscribe' && token === account.metaVerifyToken) {
                console.log(`WEBHOOK_VERIFIED for account: ${accountId}`);
                return res.status(200).send(challenge);
            } else {
                return res.sendStatus(403); // Token mismatch
            }
        }

        return res.sendStatus(400);
    } catch (error) {
        console.error("Webhook Verification Error:", error);
        return res.sendStatus(500);
    }
};


export const MetaWebhookforAdV1 = async (req: Request, res: Response) => {
    try {

        const { accountId } = req.params
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadId = change.value.leadgen_id;
                        const pageId = change.value.page_id; // The ID of the Facebook Page that got the lead

                        // --- CHANGE 1: Search using your exact schema field name ---
                        // const organization = await OrganizationModel.findOne({ facebookPageId: pageId });
                        const account = await resolveMetaAccount(req)


                        if (!account) {
                            console.error(`Webhook Ignored: No account found for Facebook Page ID: ${pageId}`);
                            continue; // Skip if this page doesn't belong to any of your tenants
                        }

                        // Safety check: Ensure the tenant actually saved their token
                        if (!account.metaAccessToken) {
                            console.error(`Webhook Failed: account ${accountId} is missing their metaAccessToken`);
                            continue;
                        }

                        // --- CHANGE 2: Use the tenant's specific token, NOT process.env ---
                        const response = await axios.get(
                            `https://graph.facebook.com/v25.0/${leadId}?access_token=${account.metaAccessToken}`
                        );

                        // Map the field_data into a single object for your Map schema
                        const dynamicFormFields = response.data.field_data.reduce((acc: any, item: any) => {
                            acc[item.name] = item.values[0];
                            return acc;
                        }, {});

                        // Save to your database under the correct tenant
                        await MetaAdLeadModel.create({
                            organizationId: account.organizationId,
                            metaLeadId: leadId,
                            formFields: dynamicFormFields,
                            adId: change.value.ad_id,
                            formName: "Meta Lead Form",
                            status: "New"
                        });
                    }
                }
            }
        }

        // Always return 200 OK to Meta immediately, regardless of what happens
        res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(200).send('EVENT_RECEIVED');
    }
};


export const getMetaAdLeads = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.query
        const leads = await MetaAdLeadModel.find({ organizationId }).sort({ createdAt: -1 });
        res.status(200).json({ ok: true, data: leads });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error fetching leads" });
    }
}


const GRAPH = "https://graph.facebook.com/v25.0";

// Follows Meta's pagination so you get ALL records, not just the first 25
async function fetchAllPages(url: string, params: any) {
    const items: any[] = [];
    let next: string | null = url;
    let first = true;
    while (next) {
        const { data }: any = await axios.get(next, first ? { params } : undefined);
        items.push(...(data.data || []));
        next = data.paging?.next || null;
        first = false;
    }
    return items;
}

async function syncLeadsFromMeta(organization: any) {
    const token = organization.metaAccessToken;

    // 1. All lead forms on the Page
    const forms = await fetchAllPages(
        `${GRAPH}/${organization.facebookPageId}/leadgen_forms`,
        { access_token: token, fields: "id,name", limit: 100 }
    );

    // 2. All leads of each form
    const ops: any[] = [];
    for (const form of forms) {
        const leads = await fetchAllPages(`${GRAPH}/${form.id}/leads`, {
            access_token: token,
            fields: "id,created_time,field_data,ad_id",
            limit: 100,
        });

        for (const lead of leads) {
            const formFields = (lead.field_data || []).reduce((acc: any, item: any) => {
                acc[item.name] = item.values[0];
                return acc;
            }, {});

            ops.push({
                updateOne: {
                    filter: { organizationId: organization._id, metaLeadId: lead.id },
                    // $setOnInsert = only creates new leads, never overwrites a status you changed in the CRM
                    update: {
                        $setOnInsert: {
                            organizationId: organization._id,
                            metaLeadId: lead.id,
                            formFields,
                            adId: lead.ad_id,
                            formName: form.name,
                            status: "New",
                        },
                    },
                    upsert: true,
                },
            });
        }
    }

    if (ops.length) await MetaAdLeadModel.bulkWrite(ops);
    return ops.length;
}


export const getMetaFormsV2 = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { organizationId } = req.params;

        if (!organizationId) {
            res.status(400).json({
                ok: false,
                message: "Organization ID is required",
            });
            return;
        }

        // Fetch this organization's Meta account and explicitly include its token.
        const account = await MetaAdAccountModel.findOne({
            organizationId,
        }).select("+metaAccessToken");

        if (!account) {
            res.status(404).json({
                ok: false,
                message: "Meta account not found for this organization",
            });
            return;
        }

        if (!account.facebookPageId || !account.metaAccessToken) {
            res.status(400).json({
                ok: false,
                message: "Facebook Page ID or Meta access token is missing",
            });
            return;
        }

        // Fetch the Instant Forms belonging to the connected Facebook Page.
        const response = await axios.get(
            `${GRAPH}/${account.facebookPageId}/leadgen_forms`,
            {
                params: {
                    fields: "id,name,status",
                    limit: 100,
                    access_token: account.metaAccessToken,
                },
            }
        );

       

        res.status(200).json({
            ok: true,
            message: "Meta forms fetched successfully",
            data: response.data.data.map(
                (form: { id: string; name?: string; status?: string }) => ({
                    id: form.id,
                    name: form.name ?? "",
                    status: form.status ?? "",
                })
            ),
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                "getMetaFormsV2 Meta API error:",
                error.response?.data ?? error.message
            );
        } else {
            console.error("getMetaFormsV2 error:", error);
        }

        res.status(500).json({
            ok: false,
            message: "Failed to fetch Meta forms",
        });
    }
};


export const metaFormLeadsV2 = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { formId } = req.query;

    if (!organizationId) {
      res.status(400).json({
        ok: false,
        message: "Organization ID is required",
      });
      return;
    }

    if (typeof formId !== "string" || !formId.trim()) {
      res.status(400).json({
        ok: false,
        message: "Form ID is required",
      });
      return;
    }

    const settings = await MetaAdAccountModel.findOne({
      organizationId,
      facebookPageId: { $exists: true, $nin: [null, ""] },
    }).select("+metaAccessToken");

    if (!settings?.metaAccessToken || !settings.facebookPageId) {
      res.status(400).json({
        ok: false,
        message: "Meta Page ID or Page Access Token is missing",
      });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${formId.trim()}/leads`,
      {
        params: {
          access_token: settings.metaAccessToken,
          fields: "id,created_time,form_id,field_data,ad_id",
          limit: 100,
        },
      }
    );

    const allLeads = response.data.data ?? [];
    const start = (page - 1) * limit;
    const leads = allLeads.slice(start, start + limit);

    res.status(200).json({
      ok: true,
      message: "Meta form leads fetched successfully",
      data: leads,
      pagination: {
        total: allLeads.length,
        page,
        limit,
        totalPages: Math.ceil(allLeads.length / limit),
      },
    });
  } catch (error: any) {
    console.error(
      "metaFormLeadsV2 error:",
      error.response?.data ?? error.message
    );

    res.status(500).json({
      ok: false,
      message: "Failed to fetch Meta form leads",
      error: error.response?.data?.error?.message ?? undefined,
    });
  }
};

export const getMetaAdLeadsv1 = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, sync } = req.query;

        // Call it once as /all-leads?organizationId=...&sync=true to pull old leads
        if (sync === "true") {
            const organization = await OrganizationModel.findById(organizationId);
            if (!organization?.facebookPageId || !organization?.metaAccessToken) {
                return res.status(400).json({ ok: false, message: "Meta Page ID or token not configured" });
            }
            await syncLeadsFromMeta(organization);
        }

        const leads = await MetaAdLeadModel.find({ organizationId }).sort({ createdAt: -1 });
        res.status(200).json({ ok: true, data: leads });
    } catch (error: any) {
        console.error("Meta leads error:", error.response?.data || error.message);
        res.status(500).json({ ok: false, message: "Error fetching leads" });
    }
};

export const updateMetaLeadStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, newStatus } = req.body;

        // 1. Update the Database and get the result immediately
        const updatedLead = await MetaAdLeadModel.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ ok: false, message: "Lead not found" });
        }

        // 2. Fetch the Organization to get their specific Meta credentials
        const organization = await OrganizationModel.findById(updatedLead.organizationId);

        if (!organization) {
            return res.status(404).json({ ok: false, message: "Organization not found" });
        }

        // 3. Map your CRM status to Meta's standard event names
        let metaEventName = "Other";
        if (newStatus === "Qualified") metaEventName = "QualifiedLead";
        if (newStatus === "Converted") metaEventName = "Purchase";

        // 4. Safely extract the email and phone from the Mongoose Map
        const email = (updatedLead.formFields as any).get('email') || "";
        const phone = (updatedLead.formFields as any).get('phone_number') || "";

        // 5. Send the update to Meta via CAPI using the Organization's credentials
        await sendCapiUpdate({
            leadEmail: email,
            leadPhone: phone,
            eventName: metaEventName,
            metaLeadId: updatedLead.metaLeadId,
            datasetId: organization.metaDatasetId,       // <-- Passed from the DB
            datasetToken: organization.metaDatasetToken  // <-- Passed from the DB
        });

        res.status(200).json({ ok: true, message: "Status updated successfully", data: updatedLead });

    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ ok: false, message: "Failed to update lead" });
    }
};