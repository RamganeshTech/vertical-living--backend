import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware'; 
import { imageUploadToS3 } from '../../utils/s3Uploads/s3ImageUploader'; 
import { addConsultationMessage, deleteConsultationMessage, editConsultationMessage, getConsultationMessages, setTechnicalConsultantStageDeadline, tehnicalConsultantCompletionStatus } from '../../controllers/stage controllers/technicalConsultant controllers/technicalConsultant.controller';
import { TechnicalConsultationModel } from '../../models/Stage Models/technical consulatation/technicalconsultation.model';


const technicalConsultRoutes = express.Router()

// 4. TECHNICAL CONSULTATION routes

technicalConsultRoutes.post("/createmessage/:projectId",imageUploadToS3.array("attachments"), addConsultationMessage); // field name used in FormData

// ✅ GET all messages for a project
technicalConsultRoutes.get("/getmessages/:projectId", getConsultationMessages);

// ✅ DELETE a specific message
technicalConsultRoutes.delete("/deletemessage/:projectId/:messageId", deleteConsultationMessage);

// EDIT a sepecific message
technicalConsultRoutes.put("/editmessage/:projectId/:messageId", editConsultationMessage);


technicalConsultRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), tehnicalConsultantCompletionStatus)
technicalConsultRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), setTechnicalConsultantStageDeadline)


// technicalConsultRoutes.post( "/upload/multiple/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), imageUploadToS3.array("file"), uploadGenericController(TechnicalConsultationModel))

export default technicalConsultRoutes

