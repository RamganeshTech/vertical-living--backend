import { Router } from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { deleteCutlist, generateCutlistPDFController, getAllCutlists, getSingleCutlist, saveCutlist } from '../../controllers/Cutlist_controller/cutlist.controller';
// Import your controllers

// Import your existing middlewares
// import { multiRoleAuthMiddleware } from '../middlewares/authMiddleware'; 
// import { imageUploadToS3, processUploadFiles } from '../middlewares/uploadMiddleware';

const CutlistRoutes = Router();


CutlistRoutes.post(
    "/save",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.any(),    // Processes field names like rooms[0].backSideLaminateImage
    processUploadFiles,      // Custom logic to handle file metadata
    saveCutlist
);

// Overloading the same controller for PUT if you prefer a cleaner URL structure
CutlistRoutes.put(
    "/save",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.any(),
    processUploadFiles,
    saveCutlist
);

CutlistRoutes.get(
    "/all",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getAllCutlists
);

CutlistRoutes.get(
    "/single/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getSingleCutlist
);

CutlistRoutes.delete(
    "/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteCutlist
);


CutlistRoutes.post(
    "/generatepdf/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    generateCutlistPDFController
);





export default CutlistRoutes;