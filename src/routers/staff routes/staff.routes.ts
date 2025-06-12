import express, { RequestHandler } from 'express';
import { getWorkersByProject, inviteWorkerByStaff, removeWorkerFromProject } from '../../controllers/staff controller/staff.controller';
import staffAuthenticatedMiddleware from '../../middlewares/staffAuthMiddleware';


const staffRoutes = express.Router()

// STAFF ROUTES
staffRoutes.post('/inviteworker',staffAuthenticatedMiddleware, inviteWorkerByStaff as RequestHandler)
staffRoutes.get('/getworker/:projectId',staffAuthenticatedMiddleware, getWorkersByProject as RequestHandler)
staffRoutes.put('/removeworker/:workerId/:projectId',staffAuthenticatedMiddleware, removeWorkerFromProject as RequestHandler)

export default staffRoutes

