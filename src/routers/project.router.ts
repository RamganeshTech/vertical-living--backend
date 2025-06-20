
import express, { RequestHandler }  from 'express';
import { assignClient, createProject, deleteProject, getProjects, updateProject } from '../controllers/project controllers/project.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../middlewares/multiRoleAuthMiddleware';

const router = express.Router()

router.post('/createproject/:organizationId', userAuthenticatedMiddleware, createProject as RequestHandler)
router.get('/getprojects/:organizationId', multiRoleAuthMiddleware('owner', "staff"), getProjects as RequestHandler)
router.delete('/deleteproject/:projectId', userAuthenticatedMiddleware, deleteProject as RequestHandler)
router.put('/updateproject/:projectId', userAuthenticatedMiddleware, updateProject as RequestHandler)
router.patch('/assignprojectclient/:projectId/:clientId', userAuthenticatedMiddleware, assignClient as RequestHandler)

export default router;