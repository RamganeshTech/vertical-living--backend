import express, { RequestHandler } from 'express';
import CTOAuthenticatedMiddleware from '../../middlewares/CTOAuthMiddleware';
import { getAllStaffsFromCTO, getWorkersByProjectFromCTO, inviteWorkerByCTO, removeWorkerFromProjectFromCTO } from '../../controllers/CTO controller/CTO.controller';
import { submitRequirementForm } from '../../controllers/requirement controllers/mainRequirement.controller';


const requirementRoutes = express.Router()

// 1 requirement routes

requirementRoutes.post('/createrequirement', submitRequirementForm)

export default requirementRoutes

