import { Router } from 'express';
import { getAllInstagramLeads, getInstagramLeadById, handleInstagramWebhook, updateInstagramLeadStatus, verifyInstagramWebhook } from '../../../controllers/marketing_controllers/lead_controllers/instagramLead.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { verifyMetaSignature } from '../../../middlewares/metaSignatureMiddleware';
import { getMetaAdLeads, getMetaAdLeadsv1, getMetaFormsV2, metaFormLeadsV2, MetaWebhookforAd, updateMetaLeadStatus, verifyMetaWebhook } from '../../../controllers/marketing_controllers/lead_controllers/meadLead.controller';
import { getMetaAds, getMetaAdSets, getMetaCampaignPerformance, getMetaCampaigns, getMetaInsights } from '../../../controllers/marketing_controllers/lead_controllers/meta_leads/metaLead.controller';

const MetaRoutes = Router();

// publickly accessible
// GET: Meta hits this once to verify you own the server
MetaRoutes.get('/webhook/:organizationId', verifyMetaWebhook);

// POST: Meta pushes leads here 24/7 whenever a form is filled
MetaRoutes.post('/webhook/:organizationId', MetaWebhookforAd);


// New: one URL per Meta account
MetaRoutes.get('/webhook/account/:accountId', verifyMetaWebhook);
MetaRoutes.post('/webhook/account/:accountId', MetaWebhookforAd);


// ==========================================
// 2. PROTECTED ROUTES (Your Frontend UI talks to these)
// ==========================================

// GET: Fetch the leads to display in your CRM table
MetaRoutes.get('/all-leads', multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAdLeads);
MetaRoutes.get('/v1/all-leads', multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAdLeadsv1);

MetaRoutes.get(
  "/v2/forms/:organizationId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getMetaFormsV2
);

MetaRoutes.get(
  "/v1/form-leads/:organizationId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  metaFormLeadsV2
);


// PUT: Update the lead status and send Conversions API (CAPI) update to Meta
MetaRoutes.put('/update-status', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateMetaLeadStatus);




MetaRoutes.get("/campaigns", multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaCampaigns);
MetaRoutes.get("/adsets", multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAdSets);
MetaRoutes.get("/ads", multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAds);
MetaRoutes.get("/insights", multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaInsights);
MetaRoutes.get("/campaign-performance", multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaCampaignPerformance);


export default MetaRoutes;