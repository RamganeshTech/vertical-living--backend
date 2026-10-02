import axios from "axios";

const GRAPH_BASE = "https://graph.facebook.com/v25.0";

interface MetaCredentials {
    accessToken: string;
    adAccountId: string; // "act_XXXXXXXXXX"
}

class MetaAdsService {
    private client(accessToken: string) {
        return axios.create({
            baseURL: GRAPH_BASE,
            params: { access_token: accessToken },
        });
    }

    async getCampaigns(creds: MetaCredentials) {
        const client = this.client(creds.accessToken);
        const { data } = await client.get(`/${creds.adAccountId}/campaigns`, {
            params: {
                fields: "id,name,status,objective,created_time,start_time,stop_time",
                limit: 100,
            },
        });
        return data.data;
    }

    async getAdSets(creds: MetaCredentials, campaignId?: string) {
        const client = this.client(creds.accessToken);
        const path = campaignId
            ? `/${campaignId}/adsets`
            : `/${creds.adAccountId}/adsets`;
        const { data } = await client.get(path, {
            params: {
                fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,targeting",
                limit: 100,
            },
        });
        return data.data;
    }

    async getAds(creds: MetaCredentials, adSetId?: string) {
        const client = this.client(creds.accessToken);
        const path = adSetId ? `/${adSetId}/ads` : `/${creds.adAccountId}/ads`;
        const { data } = await client.get(path, {
            params: {
                fields: "id,name,status,adset_id,campaign_id,creative",
                limit: 100,
            },
        });
        return data.data;
    }

    // level: "account" | "campaign" | "adset" | "ad"
    async getInsights(
        creds: MetaCredentials,
        opts: {
            level: "account" | "campaign" | "adset" | "ad";
            datePreset?: string; // "last_7d" | "last_30d" | "this_month" etc
            since?: string;
            until?: string;
            objectId?: string; // specific campaign/adset/ad id; defaults to ad account
        }
    ) {
        const client = this.client(creds.accessToken);
        const path = `/${opts.objectId || creds.adAccountId}/insights`;

        const params: Record<string, any> = {
            level: opts.level,
            fields:
                "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name," +
                "impressions,clicks,spend,reach,ctr,cpc,cpm,actions,cost_per_action_type",
        };

        if (opts.since && opts.until) {
            params.time_range = JSON.stringify({ since: opts.since, until: opts.until });
        } else {
            params.date_preset = opts.datePreset || "last_30d";
        }

        const { data } = await client.get(path, { params });
        return data.data;
    }

    // Convenience: campaign-level insights joined with lead count parsed from actions[]
    async getCampaignPerformance(creds: MetaCredentials, datePreset = "last_30d") {
        const insights = await this.getInsights(creds, {
            level: "campaign",
            datePreset,
        });

        return insights.map((row: any) => {
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
    }
}

export default new MetaAdsService();