
import express, { RequestHandler }  from 'express';
import { assignClient, createProject, deleteProject, getProjects, getProjectsWithPagination, updateProject } from '../controllers/project controllers/project.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../middlewares/multiRoleAuthMiddleware';
import { checkActivePlan } from './../middlewares/checkActivePlan';

const router = express.Router()

router.post('/createproject/:organizationId', multiRoleAuthMiddleware("owner", "CTO", "staff"),  createProject as RequestHandler)
//  used in other modeules to get list of projects
router.get('/getprojects/:organizationId', multiRoleAuthMiddleware('owner', "staff", "CTO", "client", "worker"), getProjects as RequestHandler)
// used to showthe list of projects in the project  module
router.get('/v1/getprojects/:organizationId', multiRoleAuthMiddleware('owner', "staff", "CTO", "client", "worker"), getProjectsWithPagination as RequestHandler)
router.delete('/deleteproject/:projectId', multiRoleAuthMiddleware("owner", "CTO"), deleteProject as RequestHandler)
router.put('/updateproject/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateProject as RequestHandler)
// belwo api not used
router.patch('/assignprojectclient/:projectId/:clientId', multiRoleAuthMiddleware("owner", "CTO", "staff"), assignClient as RequestHandler)

export default router;