import express from 'express';
import ClientAuthMiddleware from '../../../middlewares/clientAuthMiddleware'; 
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware'; 
import { uploadGenericController } from '../../../utils/common features/uploadFiles'; 
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader'; 
import { createRoom, createSiteMeasurement, DeleteRooms, deleteSiteMeasurement, getTheSiteMeasurements, setSiteMeasurementStageDeadline, siteMeasurementCompletionStatus, updateCommonSiteMeasurements, updateRoomSiteMeasurements } from '../../../controllers/stage controllers/site measurement controller/siteMeasurements.controller';
import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';

const siteMeasurementRoutes = express.Router()

// 2 Site requirements routes

siteMeasurementRoutes.post('/createmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),  checkPreviousStageCompleted(RequirementFormModel), createSiteMeasurement )
siteMeasurementRoutes.post('/createroom/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), createRoom )
siteMeasurementRoutes.get('/getmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(RequirementFormModel), getTheSiteMeasurements)

siteMeasurementRoutes.put('/updatecommonmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), checkPreviousStageCompleted(RequirementFormModel), updateCommonSiteMeasurements)
siteMeasurementRoutes.put('/updateroommeasurement/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), checkPreviousStageCompleted(RequirementFormModel), updateRoomSiteMeasurements)
siteMeasurementRoutes.patch('/deleteroom/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), checkPreviousStageCompleted(RequirementFormModel),DeleteRooms)
siteMeasurementRoutes.put('/deletesitemeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"),checkPreviousStageCompleted(RequirementFormModel), deleteSiteMeasurement)

siteMeasurementRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), checkPreviousStageCompleted(RequirementFormModel),setSiteMeasurementStageDeadline)
siteMeasurementRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"),checkPreviousStageCompleted(RequirementFormModel), siteMeasurementCompletionStatus)


siteMeasurementRoutes.post( "/upload/multiple/:projectId/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),checkPreviousStageCompleted(RequirementFormModel), imageUploadToS3.array("file"), uploadGenericController(SiteMeasurementModel))

export default siteMeasurementRoutes

