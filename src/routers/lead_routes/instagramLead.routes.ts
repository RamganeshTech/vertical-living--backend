import { Router } from 'express';
import { getAllInstagramLeads, getInstagramLeadById, handleInstagramWebhook, updateInstagramLeadStatus, verifyInstagramWebhook } from '../../controllers/lead_controllers/instagramLead.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { verifyMetaSignature } from '../../middlewares/metaSignatureMiddleware';

const leadRoutes = Router();

// publickly accessible



// leadRoutes.post('/submit', handleInstagramWebhook);

// // only authrozied users can access 

// leadRoutes.get(
//     '/getall',
//     multiRoleAuthMiddleware("owner", "CTO", "staff"),
//     verifyInstagramWebhook
// );

// The POST is for incoming leads (protected by Meta's signature).
leadRoutes.get('/instagram/webhook', verifyInstagramWebhook);
leadRoutes.post('/instagram/webhook', verifyMetaSignature, handleInstagramWebhook);
leadRoutes.get('/getall', multiRoleAuthMiddleware("owner", "CTO", "staff"), getAllInstagramLeads);
leadRoutes.get('/getsingle/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"), getInstagramLeadById);
leadRoutes.patch('/update-status', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateInstagramLeadStatus);

export default leadRoutes;