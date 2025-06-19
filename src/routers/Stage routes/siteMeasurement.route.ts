import express from 'express';
import ClientAuthMiddleware from '../../middlewares/clientAuthMiddleware'; 
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware'; 
import { uploadGenericController } from '../../utils/common features/uploadFiles'; 
import { imageUploadToS3 } from '../../utils/s3Uploads/s3ImageUploader'; 
import { createSiteMeasurement, DeleteRooms, getTheSiteMeasurements, siteMeasurementCompletionStatus, updateCommonSiteMeasurements, updateRoomSiteMeasurements } from '../../controllers/stage controllers/siteMeasurements.controller';
import { SiteMeasurementModel } from '../../models/Stage Models/siteMeasurement models/siteMeasurement.model';


const siteMeasurementRoutes = express.Router()

// 2 Site requirements routes

siteMeasurementRoutes.post('/createmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), createSiteMeasurement )
siteMeasurementRoutes.get('/getmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), getTheSiteMeasurements)

siteMeasurementRoutes.put('/updatecommonmeasurement/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), updateCommonSiteMeasurements)
siteMeasurementRoutes.put('/updateroommeasurement/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), updateRoomSiteMeasurements)
siteMeasurementRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), siteMeasurementCompletionStatus)
siteMeasurementRoutes.patch('/deleteroom/:projectId/:roomId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), DeleteRooms)

siteMeasurementRoutes.post( "/upload/multiple/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), imageUploadToS3.array("file"), uploadGenericController(SiteMeasurementModel))

export default siteMeasurementRoutes

