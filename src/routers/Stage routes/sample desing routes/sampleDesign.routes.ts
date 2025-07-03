import express from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { addRoom, deleteFileFromRoom, deleteRoom, getFilesFromRoom, sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { deleteKitchenFile, deleteLivingHallFile, deleteWardrobeFile, getKitchenDesign, getLivingHallFiles, getWardrobeDesign, uploadKitchenFiles, uploadLivingHallFiles, uploadWardrobeFiles } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";


const sampleDesignRoutes = express.Router();




// Add a new room
sampleDesignRoutes.post("/:projectId/rooms", addRoom);

// Upload files to a dynamic room
sampleDesignRoutes.post("/:projectId/rooms/:roomName/upload", imageUploadToS3.array("files"), uploadFilesToRoom);

// Get files from a room
sampleDesignRoutes.get("/:projectId/rooms", getFilesFromRoom);

// Delete file by index
sampleDesignRoutes.delete("/:projectId/rooms/:roomName/delete/:fileIndex", deleteFileFromRoom);
sampleDesignRoutes.delete("/:projectId/:roomId/deleteroom", deleteRoom);


sampleDesignRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), setSampleDesignStageDeadline)
sampleDesignRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), sampleDesignCompletionStatus)


export default sampleDesignRoutes;
