import express, { RequestHandler } from 'express';
import CTOAuthenticatedMiddleware from '../../middlewares/CTOAuthMiddleware';
import { getAllStaffsFromCTO, getWorkersByProjectFromCTO, inviteWorkerByCTO, removeWorkerFromProjectFromCTO } from '../../controllers/CTO controller/CTO.controller';


const CTORoutes = express.Router()

// CTO ROUTES
CTORoutes.post('/inviteworker',CTOAuthenticatedMiddleware, inviteWorkerByCTO as RequestHandler)
CTORoutes.get('/getworker/:projectId',CTOAuthenticatedMiddleware, getWorkersByProjectFromCTO as RequestHandler)
CTORoutes.put('/removeworker/:workerId/:projectId',CTOAuthenticatedMiddleware, removeWorkerFromProjectFromCTO as RequestHandler)

CTORoutes.get('/getallstaff',CTOAuthenticatedMiddleware, getAllStaffsFromCTO as RequestHandler)
export default CTORoutes

