import { Request, Response } from "express";
import axios from "axios";
import OrganizationModel from "../../../../models/organization models/organization.model";

const GRAPH_BASE = "https://graph.facebook.com/v25.0";

export const getMetaCampaigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.query;

        const organization = await OrganizationModel.findById(organizationId);
        if (!organization || !organization.metaAccessToken || !organization.metaAdAccountId) {
            return res.status(400).json({ ok: false, message: "Meta ad account not connected" });
        }

        const { data } = await axios.get(`${GRAPH_BASE}/${organization.metaAdAccountId}/campaigns`, {
            params: {
                access_token: organization.metaAccessToken,
                fields: "id,name,status,objective,created_time,start_time,stop_time",
                limit: 100,
            },
        });

        res.status(200).json({ ok: true, data: data.data });
    } catch (error) {
        console.error("Get Campaigns Error:", error);
        res.status(500).json({ ok: false, message: "Error fetching campaigns" });
    }
};

export const getMetaAdSets = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, campaignId } = req.query;

        const organization = await OrganizationModel.findById(organizationId);
        if (!organization || !organization.metaAccessToken || !organization.metaAdAccountId) {
            return res.status(400).json({ ok: false, message: "Meta ad account not connected" });
        }

        const path = campaignId
            ? `${GRAPH_BASE}/${campaignId}/adsets`
            : `${GRAPH_BASE}/${organization.metaAdAccountId}/adsets`;

        const { data } = await axios.get(path, {
            params: {
                access_token: organization.metaAccessToken,
                fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,targeting",
                limit: 100,
            },
        });

        res.status(200).json({ ok: true, data: data.data });
    } catch (error) {
        console.error("Get AdSets Error:", error);
        res.status(500).json({ ok: false, message: "Error fetching ad sets" });
    }
};

export const getMetaAds = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, adSetId } = req.query;

        const organization = await OrganizationModel.findById(organizationId);
        if (!organization || !organization.metaAccessToken || !organization.metaAdAccountId) {
            return res.status(400).json({ ok: false, message: "Meta ad account not connected" });
        }

        const path = adSetId
            ? `${GRAPH_BASE}/${adSetId}/ads`
            : `${GRAPH_BASE}/${organization.metaAdAccountId}/ads`;

        const { data } = await axios.get(path, {
            params: {
                access_token: organization.metaAccessToken,
                fields: "id,name,status,adset_id,campaign_id,creative",
                limit: 100,
            },
        });

        res.status(200).json({ ok: true, data: data.data });
    } catch (error) {
        console.error("Get Ads Error:", error);
        res.status(500).json({ ok: false, message: "Error fetching ads" });
    }
};

export const getMetaInsights = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, level, datePreset, since, until, objectId } = req.query;

        const organization = await OrganizationModel.findById(organizationId);
        if (!organization || !organization.metaAccessToken || !organization.metaAdAccountId) {
            return res.status(400).json({ ok: false, message: "Meta ad account not connected" });
        }

        const targetId = (objectId as string) || organization.metaAdAccountId;

        const params: Record<string, any> = {
            access_token: organization.metaAccessToken,
            level: level || "campaign",
            fields:
                "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name," +
                "impressions,clicks,spend,reach,ctr,cpc,cpm,actions,cost_per_action_type",
        };

        if (since && until) {
            params.time_range = JSON.stringify({ since, until });
        } else {
            params.date_preset = datePreset || "last_30d";
        }

        const { data } = await axios.get(`${GRAPH_BASE}/${targetId}/insights`, { params });

        res.status(200).json({ ok: true, data: data.data });
    } catch (error) {
        console.error("Get Insights Error:", error);
        res.status(500).json({ ok: false, message: "Error fetching insights" });
    }
};

export const getMetaCampaignPerformance = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, datePreset } = req.query;

        const organization = await OrganizationModel.findById(organizationId);
        if (!organization || !organization.metaAccessToken || !organization.metaAdAccountId) {
            return res.status(400).json({ ok: false, message: "Meta ad account not connected" });
        }

        const { data } = await axios.get(`${GRAPH_BASE}/${organization.metaAdAccountId}/insights`, {
            params: {
                access_token: organization.metaAccessToken,
                level: "campaign",
                date_preset: datePreset || "last_30d",
                fields:
                    "campaign_id,campaign_name,impressions,clicks,spend,reach,ctr,cpc,actions,cost_per_action_type",
            },
        });

        const campaigns = data.data.map((row: any) => {
            const leadAction = (row.actions || []).find(
                (a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
            );
            const costPerLead = (row.cost_per_action_type || []).find(
                (a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
            );

            return {
                campaignId: row.campaign_id,
                campaignName: row.campaign_name,
                impressions: Number(row.impressions || 0),
                clicks: Number(row.clicks || 0),
                spend: Number(row.spend || 0),
                reach: Number(row.reach || 0),
                ctr: Number(row.ctr || 0),
                cpc: Number(row.cpc || 0),
                leads: leadAction ? Number(leadAction.value) : 0,
                costPerLead: costPerLead ? Number(costPerLead.value) : null,
            };
        });

        const totals = campaigns.reduce(
            (acc: any, c: any) => ({
                spend: acc.spend + c.spend,
                impressions: acc.impressions + c.impressions,
                clicks: acc.clicks + c.clicks,
                leads: acc.leads + c.leads,
            }),
            { spend: 0, impressions: 0, clicks: 0, leads: 0 }
        );

        res.status(200).json({
            ok: true,
            data: {
                kpi: { ...totals, costPerLead: totals.leads ? totals.spend / totals.leads : 0 },
                campaigns,
            },
        });
    } catch (error) {
        console.error("Get Campaign Performance Error:", error);
        res.status(500).json({ ok: false, message: "Error fetching campaign performance" });
    }
};