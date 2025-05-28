import express, { RequestHandler } from 'express';
import { deleteComment,  } from '../controllers/taskComment controllers/taskcomment.controller';
import { createTask, updateTask } from '../controllers/task controllers/task.controller';

const router = express.Router()

router.post('/createtask/:projectId/:taskListId', createTask as RequestHandler)
router.put('/updatetask/:projectId/:taskListId/:taskId', updateTask as RequestHandler)

export default router