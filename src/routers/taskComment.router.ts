import express, { RequestHandler } from 'express';
import { deleteComment, editComment } from '../controllers/taskComment controllers/taskcomment.controller';

const router = express.Router()

router.patch('/comment/editcomment/:taskId/:commentId', editComment as RequestHandler)
router.delete('/comment/deleteComment/:taskId/:commentId', deleteComment as RequestHandler)

export default router