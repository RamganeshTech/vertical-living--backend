import express from 'express';
import {  createRoomRequirement, deleteRequirementSectionFileController, deleteRequirementStageFile, deleteRoomItemController, deleteRoomRequirement, generateShareableFormLink, getAllInfo, getSingleRoom, markFormAsCompleted, setRequirementStageDeadline, submitRequirementForm, updateRoomItem, uploadRequirementSectionFilesController } from '../../../controllers/stage controllers/requirement controllers/mainRequirementNew.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { uploadGenericController } from '../../../utils/common features/uploadFiles';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/mainRequirementNew.model';
import {imageUploadToS3, processUploadFiles}  from '../../../utils/s3Uploads/s3upload';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';


const requirementRoutes = express.Router()

// 1 requirement routes


// need to change
requirementRoutes.post('/createRoom/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkIfStaffIsAssignedToStage(RequirementFormModel), createRoomRequirement)
requirementRoutes.delete('/deleteroom/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkIfStaffIsAssignedToStage(RequirementFormModel), deleteRoomRequirement)
// need to change

requirementRoutes.put('/updateroomitem/:projectId/:roomId/:itemId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkIfStaffIsAssignedToStage(RequirementFormModel), updateRoomItem)
requirementRoutes.delete('/deleteitem/:projectId/:roomId/:itemId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkIfStaffIsAssignedToStage(RequirementFormModel), deleteRoomItemController)

// for clinet info
requirementRoutes.post('/createrequirement/:projectId', checkIfStaffIsAssignedToStage(RequirementFormModel), submitRequirementForm)
// need to change

requirementRoutes.get('/getrequirementform/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getAllInfo)
// need to change

requirementRoutes.get('/getroomwise/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getSingleRoom)

requirementRoutes.patch('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkIfStaffIsAssignedToStage(RequirementFormModel), setRequirementStageDeadline)

requirementRoutes.post('/formsharelink/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkIfStaffIsAssignedToStage(RequirementFormModel), generateShareableFormLink)
// requirementRoutes.patch('/lockupdation/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkIfStaffIsAssignedToStage(RequirementFormModel), lockRequirementForm)
requirementRoutes.patch('/formcompleted/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkIfStaffIsAssignedToStage(RequirementFormModel), markFormAsCompleted)

// requirementRoutes.delete('/deleteform/:projectId',multiRoleAuthMiddleware("owner", "staff", "CTO"),  checkIfStaffIsAssignedToStage(RequirementFormModel), delteRequirementForm)

requirementRoutes.post( "/upload/multiple/:projectId/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkIfStaffIsAssignedToStage(RequirementFormModel), imageUploadToS3.array("file"), processUploadFiles, uploadGenericController(RequirementFormModel))
requirementRoutes.patch("/:projectId/deleteuploadedfile/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",),  checkIfStaffIsAssignedToStage(RequirementFormModel), deleteRequirementStageFile);


// iun comment this to go back to the normal ktich and toher 3 routes if  you want
// requirementRoutes.put("/:projectId/updatekitchen", multiRoleAuthMiddleware("owner","CTO",  "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateKitchenSection);
// requirementRoutes.put("/:projectId/updatebedroom", multiRoleAuthMiddleware("owner","CTO",  "staff", "client"), notToUpdateIfStageCompleted(RequirementFormModel),checkIfStaffIsAssignedToStage(RequirementFormModel), updateBedroomSection);
// requirementRoutes.put("/:projectId/updatewardrobe", multiRoleAuthMiddleware("owner","CTO", "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateWardrobeSection);
// requirementRoutes.put("/:projectId/updatelivinghall", multiRoleAuthMiddleware("owner","CTO", "staff",  "client"),notToUpdateIfStageCompleted(RequirementFormModel), checkIfStaffIsAssignedToStage(RequirementFormModel), updateLivingHallSection);

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

