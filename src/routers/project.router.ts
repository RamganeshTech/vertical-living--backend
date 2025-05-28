
import express, { RequestHandler }  from 'express';
import { createProject, deleteProject, getProjects } from '../controllers/project controllers/project.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';

const router = express.Router()

router.post('/createproject', userAuthenticatedMiddleware, createProject as RequestHandler)
router.get('/getprojects', userAuthenticatedMiddleware, getProjects as RequestHandler)
router.delete('/deleteproject/:projectId', userAuthenticatedMiddleware, deleteProject as RequestHandler)

export default router;