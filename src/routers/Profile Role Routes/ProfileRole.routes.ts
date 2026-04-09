import express from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { updateProfile } from "../../controllers/Profile Role Controllers/updateProfileRole.controller";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";

const profileRoutes = express.Router();

profileRoutes.put("/update-profile", multiRoleAuthMiddleware("owner", "worker", "staff", "client", "CTO"), imageUploadToS3.single("profileImage"), processUploadFiles, updateProfile);

export default profileRoutes;
