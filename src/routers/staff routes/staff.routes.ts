import express, { RequestHandler } from 'express';
// import { getWorkersByProject, inviteWorkerByStaff, removeWorkerFromProject } from '../../controllers/staff controller/staff.controller';
import staffAuthenticatedMiddleware from '../../middlewares/staffAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const staffRoutes = express.Router()


export default staffRoutes

