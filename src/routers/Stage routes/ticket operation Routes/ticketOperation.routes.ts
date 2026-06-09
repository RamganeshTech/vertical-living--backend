import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware'; 
// import { imageUploadToS3 } from '../../utils/s3Uploads/s3ImageUploader'; 
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { addResponse, createIssue, deleteConversation, forwardIssue, getProjectDiscussions, getUnreadTicketCount, markAllTicketAsRead } from '../../../controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller';

// ISSUE DISCUSSION routes

const issueDiscussionRoutes = express.Router()

issueDiscussionRoutes.post("/providesolution/:organizationId/:convoId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), imageUploadToS3.array("files"), processUploadFiles, addResponse); // field name used in FormData
issueDiscussionRoutes.post("/createissue",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), imageUploadToS3.array("files"), processUploadFiles, createIssue); // field name used in FormData

// ✅ GET all messages for a project
issueDiscussionRoutes.get("/getall/:organizationId" ,multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getProjectDiscussions);

// ✅ DELETE a specific message
issueDiscussionRoutes.delete("/deletemessage/:organizationId/:convoId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),  deleteConversation);

issueDiscussionRoutes.put(
    "/forward/:organizationId/:convoId",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
    forwardIssue
);


// Get unread count
issueDiscussionRoutes.get('/unread-count/:organizationId',  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getUnreadTicketCount);

// Mark all as read
issueDiscussionRoutes.patch('/mark-all-read/:organizationId',  multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), markAllTicketAsRead);


// EDIT a sepecific message
// issueDiscussionRoutes.put("/editmessage/:projectId/:messageId",multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),  );



export default issueDiscussionRoutes

