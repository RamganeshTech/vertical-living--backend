import express, { RequestHandler } from 'express';
import userAuthenticatedMiddleware from '../../middlewares/userAuthMiddleware';
import { inviteWorkerByOwner, getWorkersByProject, removeWorkerFromProject, getAllStaffs } from '../../controllers/OrgOwner controller/OrgOwner.controller';


const orgOwnerRoutes = express.Router()

// OWNER ROUTES
orgOwnerRoutes.post('/inviteworker',userAuthenticatedMiddleware, inviteWorkerByOwner as RequestHandler)
orgOwnerRoutes.get('/getworker/:projectId',userAuthenticatedMiddleware, getWorkersByProject as RequestHandler)
orgOwnerRoutes.put('/removeworker/:workerId/:projectId',userAuthenticatedMiddleware, removeWorkerFromProject as RequestHandler)

orgOwnerRoutes.get('/getallstaff',userAuthenticatedMiddleware, getAllStaffs as RequestHandler)
export default orgOwnerRoutes

