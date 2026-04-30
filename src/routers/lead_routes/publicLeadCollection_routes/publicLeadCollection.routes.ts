import { Router } from 'express';
// import { 
//     createPublicLead, 
//     getAllPublicLeads, 
//     getSinglePublicLead 
// } from '../../controllers/publicLead.controller'; // Adjust path as needed
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { createPublicLead, getAllPublicLeads, getSinglePublicLead } from '../../../controllers/lead_controllers/publicLeadCollection_controllers/publicLeadCollection.controller';

const publicLeadCollectionRoutes = Router();

/**
 * Endpoint: /api/v1/public/lead/submit
 * Publicly accessible for website inquiry form
 */
publicLeadCollectionRoutes.post('/submit', createPublicLead);

/**
 * Endpoint: /api/v1/public/lead/getall
 * Protected: Admin list view with filters
 */
publicLeadCollectionRoutes.get(
    '/getall',
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    getAllPublicLeads
);

/**
 * Endpoint: /api/v1/public/lead/get/:id
 * Protected: Admin single detailed view
 */
publicLeadCollectionRoutes.get(
    '/get/:id',
    multiRoleAuthMiddleware("owner", "CTO", "staff"),
    getSinglePublicLead
);

export default publicLeadCollectionRoutes;