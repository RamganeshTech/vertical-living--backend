import express from 'express';
import workerAuthenticatedMiddleware from '../../middlewares/workerAuthMiddleware';


const workerRoutes = express.Router()

workerRoutes.get('/tasks', workerAuthenticatedMiddleware)

export default workerRoutes

