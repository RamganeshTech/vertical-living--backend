import express from "express";
import { multiRoleAuthMiddleware } from "../middlewares/multiRoleAuthMiddleware";
import { deleteConfigImage, deleteConfigVideo, getProjectConfiguration, updateTermsAndConditions, uploadConfigImages, uploadConfigVideos } from "../controllers/project controllers/projectConfiguration.controller";
import { imageUploadToS3, processUploadFiles } from "../utils/s3Uploads/s3upload";
// import {
//     getProjectConfiguration,
//     uploadConfigVideos,
//     uploadConfigImages,
//     updateTermsAndConditions
// } from "../controllers/projectConfigurationController"; // Adjust the path
// import { multiRoleAuthMiddleware } from "../middlewares/authMiddleware"; // Adjust the path
// import { imageUploadToS3 } from "../middlewares/s3UploadMiddleware"; // Adjust the path

const projectConfigRoutes = express.Router();

// 1. GET: Fetch the Entire Configuration
projectConfigRoutes.get(
    "/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getProjectConfiguration
);

// 2. POST: Upload Videos
projectConfigRoutes.post(
    "/:organizationId/videos",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("videos"), 
    processUploadFiles,
    uploadConfigVideos
);

// 3. POST: Upload Images
projectConfigRoutes.post(
    "/:organizationId/images",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("images"), 
    processUploadFiles,
    uploadConfigImages
);

// 4. PUT: Update Terms and Conditions
projectConfigRoutes.put(
    "/:organizationId/terms",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateTermsAndConditions
);


// 5. DELETE: Remove a Video
projectConfigRoutes.delete(
    "/:organizationId/videos/:videoId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteConfigVideo
);

// 6. DELETE: Remove an Image
projectConfigRoutes.delete(
    "/:organizationId/images/:imageId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteConfigImage
);

export default projectConfigRoutes;