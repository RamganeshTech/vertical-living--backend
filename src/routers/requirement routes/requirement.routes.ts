import express from 'express';
import { generateShareableFormLink, lockRequirementForm, markFormAsCompleted, submitRequirementForm } from '../../controllers/requirement controllers/mainRequirement.controller';
import ClientAuthMiddleware from '../../middlewares/clientAuthMiddleware';
import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../controllers/client controllers/clientRequirement.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const requirementRoutes = express.Router()

// 1 requirement routes

requirementRoutes.post('/createrequirement/:projectId', submitRequirementForm)

requirementRoutes.post('/formsharelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), generateShareableFormLink)
requirementRoutes.patch('/lockupdation/:formId', lockRequirementForm)
requirementRoutes.patch('/formcompleted/:formId', markFormAsCompleted)

requirementRoutes.put("/:projectId/updatekitchen", ClientAuthMiddleware, updateKitchenSection);
requirementRoutes.put("/:projectId/updatebedroom", ClientAuthMiddleware, updateBedroomSection);
requirementRoutes.put("/:projectId/updatewardrobe", ClientAuthMiddleware, updateWardrobeSection);
requirementRoutes.put("/:projectId/updatelivinghall", ClientAuthMiddleware, updateLivingHallSection);


export default requirementRoutes

