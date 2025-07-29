import express from 'express';
import ClientAuthMiddleware from '../../../middlewares/clientAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { uploadGenericController } from '../../../utils/common features/uploadFiles';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader'; 
import { createRoom, createSiteMeasurement, DeleteRooms, deleteSiteMeasurement, deleteSiteMeasurementFile, deleteSiteMeasurementRoomImage, getTheSiteMeasurements, setSiteMeasurementStageDeadline, siteMeasurementCompletionStatus, updateCommonSiteMeasurements, updateRoomImageName, updateRoomSiteMeasurements, uploadSiteMeasurementRoomImages } from '../../../controllers/stage controllers/site measurement controller/siteMeasurements.controller';
import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';

const siteMeasurementRoutes = express.Router()

// 2 Site requirements routes

siteMeasurementRoutes.post('/createmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel), createSiteMeasurement)
siteMeasurementRoutes.post('/createroom/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  createRoom)
siteMeasurementRoutes.get('/getmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), getTheSiteMeasurements)

siteMeasurementRoutes.put('/updatecommonmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  updateCommonSiteMeasurements)
siteMeasurementRoutes.put('/updateroommeasurement/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  updateRoomSiteMeasurements)
siteMeasurementRoutes.patch('/deleteroom/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  DeleteRooms)
siteMeasurementRoutes.put('/deletesitemeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  deleteSiteMeasurement)

siteMeasurementRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  setSiteMeasurementStageDeadline)
siteMeasurementRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel),  checkIfStaffIsAssignedToStage(SiteMeasurementModel), siteMeasurementCompletionStatus)

siteMeasurementRoutes.patch("/:projectId/deleteuploadedfile/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel), checkIfStaffIsAssignedToStage(SiteMeasurementModel),  deleteSiteMeasurementFile);
siteMeasurementRoutes.post("/upload/multiple/:projectId/:formId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel),  checkIfStaffIsAssignedToStage(SiteMeasurementModel), imageUploadToS3.array("file"), processUploadFiles, uploadGenericController(SiteMeasurementModel))

siteMeasurementRoutes.post("/uploadroom/:projectId/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel),  checkIfStaffIsAssignedToStage(SiteMeasurementModel), imageUploadToS3.array("file"), processUploadFiles, uploadSiteMeasurementRoomImages)
siteMeasurementRoutes.delete("/deleteroom/:projectId/:roomId/:uploadId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel),  checkIfStaffIsAssignedToStage(SiteMeasurementModel), imageUploadToS3.array("file"), processUploadFiles, deleteSiteMeasurementRoomImage)
siteMeasurementRoutes.patch("/updateimgname/:projectId/:roomId/:uploadId", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(RequirementFormModel), notToUpdateIfStageCompleted(SiteMeasurementModel),  checkIfStaffIsAssignedToStage(SiteMeasurementModel),  updateRoomImageName)

export default siteMeasurementRoutes

