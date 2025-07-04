import express from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { addRoom, deleteFileFromRoom, deleteRoom, getFilesFromRoom, sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
// import { deleteKitchenFile, deleteLivingHallFile, deleteWardrobeFile, getKitchenDesign, getLivingHallFiles, getWardrobeDesign, uploadKitchenFiles, uploadLivingHallFiles, uploadWardrobeFiles } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";


const sampleDesignRoutes = express.Router();




// Add a new room
sampleDesignRoutes.post("/:projectId/rooms", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), addRoom);

// Upload files to a dynamic room
sampleDesignRoutes.post("/:projectId/rooms/:roomName/upload", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), imageUploadToS3.array("files"), uploadFilesToRoom);

// Get files from a room
sampleDesignRoutes.get("/:projectId/rooms", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(SiteMeasurementModel), getFilesFromRoom);

// Delete file by index
sampleDesignRoutes.delete("/:projectId/rooms/:roomName/delete/:fileIndex", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), deleteFileFromRoom);
sampleDesignRoutes.delete("/:projectId/:roomId/deleteroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), deleteRoom);


sampleDesignRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), setSampleDesignStageDeadline)
sampleDesignRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), sampleDesignCompletionStatus)


export default sampleDesignRoutes;
