import express from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { addRoom, deleteFileFromRoom, deleteRoom, getFilesFromRoom, sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
// import { deleteKitchenFile, deleteLivingHallFile, deleteWardrobeFile, getKitchenDesign, getLivingHallFiles, getWardrobeDesign, uploadKitchenFiles, uploadLivingHallFiles, uploadWardrobeFiles } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";


const sampleDesignRoutes = express.Router();




// Add a new room
sampleDesignRoutes.post("/:projectId/rooms", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel),  notToUpdateIfStageCompleted(SampleDesignModel),addRoom);

// Upload files to a dynamic room
sampleDesignRoutes.post("/:projectId/rooms/:roomName/upload", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), notToUpdateIfStageCompleted(SampleDesignModel), imageUploadToS3.array("files"), processUploadFiles, uploadFilesToRoom);

// Get files from a room
sampleDesignRoutes.get("/:projectId/rooms", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), checkPreviousStageCompleted(SiteMeasurementModel), getFilesFromRoom);

// Delete file by index
sampleDesignRoutes.delete("/:projectId/rooms/:roomName/delete/:fileIndex", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), notToUpdateIfStageCompleted(SampleDesignModel), deleteFileFromRoom);
sampleDesignRoutes.delete("/:projectId/:roomId/deleteroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel),  notToUpdateIfStageCompleted(SampleDesignModel),deleteRoom);


sampleDesignRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel), notToUpdateIfStageCompleted(SampleDesignModel), setSampleDesignStageDeadline)
sampleDesignRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(SiteMeasurementModel),  notToUpdateIfStageCompleted(SampleDesignModel),sampleDesignCompletionStatus)


export default sampleDesignRoutes;
