import express from 'express';
import { delteRequirementForm, generateShareableFormLink, getFormFilledDetails, lockRequirementForm, markFormAsCompleted, setRequirementStageDeadline, submitRequirementForm } from '../../../controllers/stage controllers/requirement controllers/mainRequirement.controller';
import ClientAuthMiddleware from '../../../middlewares/clientAuthMiddleware';
import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../../controllers/client controllers/clientRequirement.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { uploadGenericController } from '../../../utils/common features/uploadFiles';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';


const requirementRoutes = express.Router()

// 1 requirement routes

requirementRoutes.post('/createrequirement/:projectId', submitRequirementForm)
requirementRoutes.get('/getrequirementform/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getFormFilledDetails)

requirementRoutes.patch('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"), setRequirementStageDeadline)

requirementRoutes.post('/formsharelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), generateShareableFormLink)
requirementRoutes.patch('/lockupdation/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), lockRequirementForm)
requirementRoutes.patch('/formcompleted/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), markFormAsCompleted)

requirementRoutes.delete('/deleteform/:projectId',multiRoleAuthMiddleware("owner", "staff", "CTO"), delteRequirementForm)

requirementRoutes.post( "/upload/multiple/:projectId/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), imageUploadToS3.array("file"), uploadGenericController(RequirementFormModel))

requirementRoutes.put("/:projectId/updatekitchen", ClientAuthMiddleware, updateKitchenSection);
requirementRoutes.put("/:projectId/updatebedroom", ClientAuthMiddleware, updateBedroomSection);
requirementRoutes.put("/:projectId/updatewardrobe", ClientAuthMiddleware, updateWardrobeSection);
requirementRoutes.put("/:projectId/updatelivinghall", ClientAuthMiddleware, updateLivingHallSection);


export default requirementRoutes

