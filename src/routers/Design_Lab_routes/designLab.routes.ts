import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import {  createDesignLab,
    updateDesignLab,
    deleteDesignLab,
    getAllDesignLabs,
    getDesignLabById,
    uploadReferenceImages,
    deleteReferenceImage,
    uploadMaterialImage,
    deleteMaterialImage, } from "../../controllers/Design_lab_Controllers/designLab.controllers";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";


const designRoutes = Router();

// ==========================================
// CRUD ROUTES
// ==========================================

designRoutes.post(
    "/create/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("files"),
    processUploadFiles,
    createDesignLab
);

designRoutes.get(
    "/getall",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getAllDesignLabs
);

designRoutes.get(
    "/getsingle/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getDesignLabById
);

designRoutes.put(
    "/updatedesign/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateDesignLab
);

designRoutes.delete(
    "/deletedesign/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteDesignLab
);

// ==========================================
// REFERENCE IMAGES ROUTES
// ==========================================

designRoutes.post(
    "/upload/:id/reference-images",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("files"),
    processUploadFiles,
    uploadReferenceImages
);

designRoutes.delete(
    "/delete/:id/reference-images/:imageId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteReferenceImage
);

// ==========================================
// MATERIAL IMAGE ROUTES
// ==========================================

designRoutes.post(
    "/upload/:id/components/:componentId/materials/:materialId/image",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("files"),
    processUploadFiles,
    uploadMaterialImage
);

designRoutes.delete(
    "/delete/:id/components/:componentId/materials/:materialId/image",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteMaterialImage
);

export default designRoutes;