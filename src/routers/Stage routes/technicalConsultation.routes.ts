import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware'; 
// import { imageUploadToS3 } from '../../utils/s3Uploads/s3ImageUploader'; 
import { addConsultationMessage, deleteConsultationMessage, editConsultationMessage, getConsultationMessages, setTechnicalConsultantStageDeadline, tehnicalConsultantCompletionStatus } from '../../controllers/stage controllers/technicalConsultant controllers/technicalConsultant.controller';
import { TechnicalConsultationModel } from '../../models/Stage Models/technical consulatation/technicalconsultation.model';
import { SampleDesignModel } from '../../models/Stage Models/sampleDesing model/sampleDesign.model';
import { checkPreviousStageCompleted } from '../../middlewares/checkPreviousStageMiddleware';
import { imageUploadToS3 } from '../../utils/s3Uploads/s3upload';


const technicalConsultRoutes = express.Router()

// 4. TECHNICAL CONSULTATION routes

technicalConsultRoutes.post("/createmessage/:projectId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),checkPreviousStageCompleted(SampleDesignModel),imageUploadToS3.array("attachments"), addConsultationMessage); // field name used in FormData

// ✅ GET all messages for a project
technicalConsultRoutes.get("/getmessages/:projectId" ,multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),checkPreviousStageCompleted(SampleDesignModel), getConsultationMessages);

// ✅ DELETE a specific message
technicalConsultRoutes.delete("/deletemessage/:projectId/:messageId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),checkPreviousStageCompleted(SampleDesignModel), deleteConsultationMessage);

// EDIT a sepecific message
technicalConsultRoutes.put("/editmessage/:projectId/:messageId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),checkPreviousStageCompleted(SampleDesignModel), editConsultationMessage);


technicalConsultRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(SampleDesignModel), tehnicalConsultantCompletionStatus)
technicalConsultRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(SampleDesignModel), setTechnicalConsultantStageDeadline)


// technicalConsultRoutes.post( "/upload/multiple/:formId",multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), imageUploadToS3.array("file"), uploadGenericController(TechnicalConsultationModel))

export default technicalConsultRoutes

