
import express, { RequestHandler }  from 'express';
import { createProject, getProjects } from '../controllers/project controllers/project.controller';

const router = express.Router()

router.post('/createproject', createProject as RequestHandler)
router.get('/getprojects', getProjects as RequestHandler)

export default router;