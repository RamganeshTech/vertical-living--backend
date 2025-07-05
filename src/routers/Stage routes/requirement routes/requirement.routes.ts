import express from 'express';
import { delteRequirementForm, generateShareableFormLink, getFormFilledDetails, lockRequirementForm, markFormAsCompleted, setRequirementStageDeadline, submitRequirementForm } from '../../../controllers/stage controllers/requirement controllers/mainRequirement.controller';
import ClientAuthMiddleware from '../../../middlewares/clientAuthMiddleware';
// import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../../controllers/client controllers/clientRequirement.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { uploadGenericController } from '../../../utils/common features/uploadFiles';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../../controllers/stage controllers/requirement controllers/subRoom.controller';
import {imageUploadToS3, processUploadFiles}  from '../../../utils/s3Uploads/s3upload';


const requirementRoutes = express.Router()
console.log("👉 imageUploadToS3:", imageUploadToS3);

// 1 requirement routes

requirementRoutes.post('/createrequirement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),submitRequirementForm)
requirementRoutes.get('/getrequirementform/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getFormFilledDetails)

requirementRoutes.patch('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"), setRequirementStageDeadline)

requirementRoutes.post('/formsharelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), generateShareableFormLink)
requirementRoutes.patch('/lockupdation/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), lockRequirementForm)
requirementRoutes.patch('/formcompleted/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), markFormAsCompleted)

requirementRoutes.delete('/deleteform/:projectId',multiRoleAuthMiddleware("owner", "staff", "CTO"), delteRequirementForm)

requirementRoutes.post( "/upload/multiple/:projectId/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), imageUploadToS3.array("file"), processUploadFiles, uploadGenericController(RequirementFormModel))

// uncommenrt this if the form shoule be updated only by the client 
// requirementRoutes.put("/:projectId/updatekitchen", ClientAuthMiddleware, updateKitchenSection);
// requirementRoutes.put("/:projectId/updatebedroom", ClientAuthMiddleware, updateBedroomSection);
// requirementRoutes.put("/:projectId/updatewardrobe", ClientAuthMiddleware, updateWardrobeSection);
// requirementRoutes.put("/:projectId/updatelivinghall", ClientAuthMiddleware, updateLivingHallSection);


requirementRoutes.put("/:projectId/updatekitchen", multiRoleAuthMiddleware("owner","CTO", "client"), updateKitchenSection);
requirementRoutes.put("/:projectId/updatebedroom", multiRoleAuthMiddleware("owner","CTO", "client"), updateBedroomSection);
requirementRoutes.put("/:projectId/updatewardrobe", multiRoleAuthMiddleware("owner","CTO", "client"), updateWardrobeSection);
requirementRoutes.put("/:projectId/updatelivinghall", multiRoleAuthMiddleware("owner","CTO", "client"), updateLivingHallSection);

export default requirementRoutes

