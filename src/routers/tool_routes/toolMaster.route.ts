// routes/layoutRoutes.js
import express from 'express';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { createTool, createToolv1, deleteTool, deleteToolImage, deleteWarrantyFile, getAllTools, getToolById, updateToolContent, updateToolImages, updateToolWarrantyImages } from '../../controllers/tool_controllers/toolMaster.controller';

const toolMasterRoutes = express.Router();

toolMasterRoutes.post('/create',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("files"), processUploadFiles,
    createTool);


toolMasterRoutes.post(
    "/v1/create",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),

    imageUploadToS3.fields([
        { name: 'toolImages' },
        { name: 'warrantyFiles' }
    ]),
    processUploadFiles,
    createToolv1
);

toolMasterRoutes.patch(
    "/updatewarrantyfiles/:id",
     multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("warrantyFiles"),
    processUploadFiles,
    updateToolWarrantyImages
);

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



// DELETE INDIVIDUAL FILES
toolMasterRoutes.delete("/tools/:toolId/tool-image/:fileId", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteToolImage);
toolMasterRoutes.delete("/tools/:toolId/warranty-file/:fileId", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteWarrantyFile);

export default toolMasterRoutes;