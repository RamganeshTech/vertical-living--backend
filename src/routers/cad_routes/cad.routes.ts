// routes/layoutRoutes.js
import express from 'express';
import multer from 'multer';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { extractLayoutDetails } from '../../controllers/cad_controllers/cad.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';

const cadRoutes = express.Router();

// ROUTE 1: Extract only (Triggered on File Upload)
cadRoutes.post('/extract/:organizationId',  multiRoleAuthMiddleware("owner", "staff", "CTO"), imageUploadToS3.single("file"), processUploadFiles, extractLayoutDetails);

export default cadRoutes;