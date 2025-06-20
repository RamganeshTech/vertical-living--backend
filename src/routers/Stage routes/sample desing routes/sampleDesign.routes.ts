import express from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { addRoom, deleteFileFromRoom, deleteRoom, getFilesFromRoom, sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { deleteKitchenFile, deleteLivingHallFile, deleteWardrobeFile, getKitchenDesign, getLivingHallFiles, getWardrobeDesign, uploadKitchenFiles, uploadLivingHallFiles, uploadWardrobeFiles } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";


const sampleDesignRoutes = express.Router();

// Kitchen routes
// sampleDesignRoutes.post("/kitchen/upload/:projectId", imageUploadToS3.array("files"), uploadKitchenFiles);
// sampleDesignRoutes.patch("/kitchen/delete/:projectId/:fileIndex", imageUploadToS3.array("files"), deleteKitchenFile);
// sampleDesignRoutes.get("/kitchen/:projectId", getKitchenDesign); // Kitchen only

// // wardrobe routes
// sampleDesignRoutes.post("/wardrobe/upload/:projectId", imageUploadToS3.array("files"), uploadWardrobeFiles);
// sampleDesignRoutes.patch("/wardrobe/delete/:projectId/:fileIndex", imageUploadToS3.array("files"), deleteWardrobeFile);
// sampleDesignRoutes.get("/wardrobe/:projectId", getWardrobeDesign); // Kitchen only


// sampleDesignRoutes.post("/livinghall/upload/:projectId", imageUploadToS3.array("files"), uploadLivingHallFiles);
// sampleDesignRoutes.patch("/livinghall/delete/:projectId/:fileIndex", imageUploadToS3.array("files"), deleteLivingHallFile);
// sampleDesignRoutes.get("/livinghall/:projectId", getLivingHallFiles); // Kitchen only



// Add a new room
sampleDesignRoutes.post("/:projectId/rooms", addRoom);

// Upload files to a dynamic room
sampleDesignRoutes.post("/:projectId/rooms/:roomName/upload", imageUploadToS3.array("files"), uploadFilesToRoom);

// Get files from a room
sampleDesignRoutes.get("/:projectId/rooms", getFilesFromRoom);

// Delete file by index
sampleDesignRoutes.delete("/:projectId/rooms/:roomName/delete/:fileIndex", deleteFileFromRoom);
sampleDesignRoutes.delete("/:projectId/:roomId/deleteroom", deleteRoom);


sampleDesignRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), setSampleDesignStageDeadline)
sampleDesignRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "staff"), sampleDesignCompletionStatus)


export default sampleDesignRoutes;
