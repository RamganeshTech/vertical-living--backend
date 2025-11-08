import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware'; 
// import { imageUploadToS3 } from '../../utils/s3Uploads/s3ImageUploader'; 
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { addResponse, createIssue, deleteConversation, forwardIssue, getProjectDiscussions } from '../../../controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller';

// ISSUE DISCUSSION routes

const issueDiscussionRoutes = express.Router()

issueDiscussionRoutes.post("/providesolution/:projectId/:convoId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), imageUploadToS3.array("files"), processUploadFiles, addResponse); // field name used in FormData
issueDiscussionRoutes.post("/createissue",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), imageUploadToS3.array("files"), processUploadFiles, createIssue); // field name used in FormData

// ✅ GET all messages for a project
issueDiscussionRoutes.get("/getall/:projectId" ,multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getProjectDiscussions);

// ✅ DELETE a specific message
issueDiscussionRoutes.delete("/deletemessage/:projectId/:convoId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),  deleteConversation);

issueDiscussionRoutes.put(
    "/forward/:projectId/:convoId",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
    forwardIssue
);
// EDIT a sepecific message
// issueDiscussionRoutes.put("/editmessage/:projectId/:messageId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),  );


// issueDiscussionRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(TechnicalConsultationModel), tehnicalConsultantCompletionStatus)
// issueDiscussionRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(TechnicalConsultationModel),  setTechnicalConsultantStageDeadline)



export default issueDiscussionRoutes

