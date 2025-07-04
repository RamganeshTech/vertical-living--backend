import express, { RequestHandler } from 'express';
import { getWorkersByProject, inviteWorkerByStaff, removeWorkerFromProject } from '../../controllers/staff controller/staff.controller';
import staffAuthenticatedMiddleware from '../../middlewares/staffAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const staffRoutes = express.Router()

// STAFF ROUTES
staffRoutes.post('/inviteworker',multiRoleAuthMiddleware("owner", "CTO", "staff"), inviteWorkerByStaff as RequestHandler)
staffRoutes.get('/getworker/:projectId',multiRoleAuthMiddleware("owner", "CTO", "staff"), getWorkersByProject as RequestHandler)
staffRoutes.put('/removeworker/:workerId/:projectId',multiRoleAuthMiddleware("owner", "CTO", "staff"), removeWorkerFromProject as RequestHandler)

export default staffRoutes

