import { Router } from 'express';
import { getAllInstagramLeads, getInstagramLeadById, handleInstagramWebhook, updateInstagramLeadStatus, verifyInstagramWebhook } from '../../../controllers/marketing_controllers/lead_controllers/instagramLead.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { verifyMetaSignature } from '../../../middlewares/metaSignatureMiddleware';
import { getMetaAdLeads, MetaWebhookforAd, updateMetaLeadStatus, verifyMetaWebhook } from '../../../controllers/marketing_controllers/lead_controllers/meadLead.controller';

const MetaRoutes = Router();

// publickly accessible
// GET: Meta hits this once to verify you own the server
MetaRoutes.get('/webhook/:organizationId', verifyMetaWebhook);

// POST: Meta pushes leads here 24/7 whenever a form is filled
MetaRoutes.post('/webhook/:organizationId', MetaWebhookforAd);


// ==========================================
// 2. PROTECTED ROUTES (Your Frontend UI talks to these)
// ==========================================

// GET: Fetch the leads to display in your CRM table
MetaRoutes.get('/all-leads', multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAdLeads);

// PUT: Update the lead status and send Conversions API (CAPI) update to Meta
MetaRoutes.put('/update-status', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateMetaLeadStatus);

export default MetaRoutes;