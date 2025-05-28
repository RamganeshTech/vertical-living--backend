
import express, { RequestHandler }  from 'express';
import {createTaskList, getTaskList} from "../controllers/taskList controllers/taskList.controller"

const router = express.Router()

router.post('/createtasklist/:projectId', createTaskList as RequestHandler)
router.get('/gettasklist/:projectId', getTaskList as RequestHandler)

export default router;