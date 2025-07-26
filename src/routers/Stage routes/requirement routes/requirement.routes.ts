import express from 'express';
import { deleteRequirementSectionFileController, deleteRequirementStageFile, delteRequirementForm, generateShareableFormLink, getFormFilledDetails, lockRequirementForm, markFormAsCompleted, setRequirementStageDeadline, submitRequirementForm, uploadRequirementSectionFilesController } from '../../../controllers/stage controllers/requirement controllers/mainRequirement.controller';
import ClientAuthMiddleware from '../../../middlewares/clientAuthMiddleware';
// import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../../controllers/client controllers/clientRequirement.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { uploadGenericController } from '../../../utils/common features/uploadFiles';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import { updateBedroomSection, updateKitchenSection, updateLivingHallSection, updateWardrobeSection } from '../../../controllers/stage controllers/requirement controllers/subRoom.controller';
import {imageUploadToS3, processUploadFiles}  from '../../../utils/s3Uploads/s3upload';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';


const requirementRoutes = express.Router()

// 1 requirement routes

requirementRoutes.post('/createrequirement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), submitRequirementForm)
requirementRoutes.get('/getrequirementform/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getFormFilledDetails)

requirementRoutes.patch('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), setRequirementStageDeadline)

requirementRoutes.post('/formsharelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), generateShareableFormLink)
requirementRoutes.patch('/lockupdation/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), lockRequirementForm)
requirementRoutes.patch('/formcompleted/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), markFormAsCompleted)

requirementRoutes.delete('/deleteform/:projectId',multiRoleAuthMiddleware("owner", "staff", "CTO"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), delteRequirementForm)

requirementRoutes.post( "/upload/multiple/:projectId/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), imageUploadToS3.array("file"), processUploadFiles, uploadGenericController(RequirementFormModel))
requirementRoutes.patch("/:projectId/deleteuploadedfile/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",), notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), deleteRequirementStageFile);


requirementRoutes.put("/:projectId/updatekitchen", multiRoleAuthMiddleware("owner","CTO",  "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateKitchenSection);
requirementRoutes.put("/:projectId/updatebedroom", multiRoleAuthMiddleware("owner","CTO",  "staff", "client"), notToUpdateIfStageCompleted(RequirementFormModel),checkIfStaffIsAssignedToStage(RequirementFormModel), updateBedroomSection);
requirementRoutes.put("/:projectId/updatewardrobe", multiRoleAuthMiddleware("owner","CTO", "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateWardrobeSection);
requirementRoutes.put("/:projectId/updatelivinghall", multiRoleAuthMiddleware("owner","CTO", "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateLivingHallSection);

requirementRoutes.post(
  "/:projectId/:sectionName/upload",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
  imageUploadToS3.array("file"),
  processUploadFiles,
  uploadRequirementSectionFilesController
);

requirementRoutes.delete(
  "/:projectId/:sectionName/:fileId/deletefile",
  multiRoleAuthMiddleware("owner", "staff", "CTO",),
  deleteRequirementSectionFileController
);


export default requirementRoutes

