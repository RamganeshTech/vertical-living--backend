import { Router } from 'express';
import { createOrderPublicTransaction, getAllOrgTransactions, verifyPaymentPublicTransaction } from '../../controllers/publicPaymentTransaction_controller/publicPayementTransaction.controller';
// import { createOrder, verifyPayment } from '../controllers/publicPayment.controller';

const PublicPaymentTransactionRoutes = Router();

// Endpoint: /api/v1/public/transaction/createorder
PublicPaymentTransactionRoutes.post('/createorder', createOrderPublicTransaction);

// Endpoint: /api/v1/public/transaction/verify
PublicPaymentTransactionRoutes.post('/verify', verifyPaymentPublicTransaction);
PublicPaymentTransactionRoutes.get('/getall', getAllOrgTransactions);

export default PublicPaymentTransactionRoutes;