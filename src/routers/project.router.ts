
import express, { RequestHandler }  from 'express';
import { assignClient, createProject, deleteProject, getProjects, updateProject } from '../controllers/project controllers/project.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../middlewares/multiRoleAuthMiddleware';
import { checkActivePlan } from './../middlewares/checkActivePlan';

const router = express.Router()

router.post('/createproject/:organizationId', multiRoleAuthMiddleware("owner", "CTO", "staff"),  createProject as RequestHandler)
router.get('/getprojects/:organizationId', multiRoleAuthMiddleware('owner', "staff", "CTO", "client", "worker"), getProjects as RequestHandler)
router.delete('/deleteproject/:projectId', multiRoleAuthMiddleware("owner", "CTO"), deleteProject as RequestHandler)
router.put('/updateproject/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProject as RequestHandler)
// belwo api not used
router.patch('/assignprojectclient/:projectId/:clientId', multiRoleAuthMiddleware("owner", "CTO", "staff"), assignClient as RequestHandler)

export default router;