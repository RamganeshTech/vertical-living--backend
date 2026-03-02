import { Router } from 'express';
import { createPublicQuote, getAllPublicCostCalculator, getSinglePublicCostCalculator } from '../../controllers/publicCostCalculator_contorller/publicCostCalculator.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
// import { createOrder, verifyPayment } from '../controllers/publicPayment.controller';

const publiCostCalculatorRoutes = Router();   

// Endpoint: /api/v1/public/transaction/createorder
publiCostCalculatorRoutes.post('/createorder', createPublicQuote);

publiCostCalculatorRoutes.get('/getall', multiRoleAuthMiddleware("owner", "CTO", "staff"), getAllPublicCostCalculator);
publiCostCalculatorRoutes.get('/get/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"), getSinglePublicCostCalculator);

export default publiCostCalculatorRoutes;