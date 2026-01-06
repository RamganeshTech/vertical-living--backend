// routes/layoutRoutes.js
import express from 'express';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { createTool, deleteTool, getAllTools, getToolById, updateToolContent, updateToolImages } from '../../controllers/tool_controllers/toolMaster.controller';

const toolMasterRoutes = express.Router();

toolMasterRoutes.post('/create', 
     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
     imageUploadToS3.array("files"), processUploadFiles,
      createTool);

toolMasterRoutes.patch(
    '/updatecontent/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    updateToolContent
);

toolMasterRoutes.patch(
    '/updateimages/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    imageUploadToS3.array("files"), 
    processUploadFiles, 
    updateToolImages
);

toolMasterRoutes.get(
    '/getall', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getAllTools
);

toolMasterRoutes.get(
    '/get/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getToolById
);

toolMasterRoutes.delete(
    '/delete/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    deleteTool
);


export default toolMasterRoutes;