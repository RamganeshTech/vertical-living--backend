import { Router } from 'express';
// Import your controllers...
import { 
    verifyWhatsAppWebhook, 
    getAllWhatsAppLeads, 
    getWhatsAppLeadById, 
    updateWhatsAppLeadStatus, 
    handleWhatsAppWebhook
} from '../../controllers/lead_controllers/whatsappLead.controller';
import { verifyMetaSignature } from '../../middlewares/metaSignatureMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';

const whatsappRoutes = Router();

// ... existing Instagram routes ...

// =======================================
// WHATSAPP ROUTES
// =======================================

// Public Webhooks (No auth middleware, only Meta signature)
whatsappRoutes.get('/whatsapp/webhook', verifyWhatsAppWebhook);
whatsappRoutes.post('/whatsapp/webhook', verifyMetaSignature, handleWhatsAppWebhook);

// Protected UI Routes
whatsappRoutes.get(
    '/whatsapp/getall', 
    multiRoleAuthMiddleware("owner", "CTO", "staff"), 
    getAllWhatsAppLeads
);

whatsappRoutes.get(
    '/whatsapp/getsingle/:id', 
    multiRoleAuthMiddleware("owner", "CTO", "staff"), 
    getWhatsAppLeadById
);

whatsappRoutes.patch(
    '/whatsapp/update-status/:id', 
    multiRoleAuthMiddleware("owner", "CTO", "staff"), 
    updateWhatsAppLeadStatus
);

export default whatsappRoutes;