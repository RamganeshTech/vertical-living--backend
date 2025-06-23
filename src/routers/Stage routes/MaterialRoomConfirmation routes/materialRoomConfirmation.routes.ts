import express from "express";
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { addItemToCustomRoom, createCustomRoom, deleteCustomRoomField, deleteMaterialRoomFile, getMaterialRoomConfirmationByProject, getSinglePredefinedRoom, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, updatePredefinedRoomField, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";
// import { addMaterialRoom, createModularWork, deleteMaterialRoom, deleteMaterialRoomFile, deleteModularWork, editModularWork, getAllMaterialRooms, getRoomById, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";


const materialConfirmationRoutes = express.Router();

// // Add a new room
// materialConfirmationRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), getAllMaterialRooms);

// // get rooms sepecifically 
// materialConfirmationRoutes.get("/:projectId/room/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), getRoomById);

// materialConfirmationRoutes.post("/:projectId/createroom/", multiRoleAuthMiddleware("owner", "staff", "CTO",), addMaterialRoom);
// materialConfirmationRoutes.post("/:projectId/creatematerial/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), createModularWork);
// materialConfirmationRoutes.put("/:projectId/editmaterial/:roomId/:workId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client"), editModularWork);
// materialConfirmationRoutes.put("/:projectId/deletematerial/:roomId/:workId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteModularWork);
// materialConfirmationRoutes.put("/:projectId/deleteroom/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteMaterialRoom);



// 📌 Get full material room confirmation stage for a project
materialConfirmationRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), getMaterialRoomConfirmationByProject);

// 📌 Get a single predefined room by roomId
materialConfirmationRoutes.get("/:projectId/predefinedroom/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), getSinglePredefinedRoom);

// 📌 Update quantity, unit, and remarks of a predefined room field
materialConfirmationRoutes.put("/:projectId/predefinedroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), updatePredefinedRoomField);

// 📌 Create a new custom room with name
materialConfirmationRoutes.post("/:projectId/customroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), createCustomRoom);

// 📌 Add a new item/field to an existing custom room
materialConfirmationRoutes.post("/:projectId/customroom/:roomId/field", multiRoleAuthMiddleware("owner", "staff", "CTO"), addItemToCustomRoom);

// 📌 Delete a field (itemKey) from a custom room
materialConfirmationRoutes.delete("/:projectId/customroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteCustomRoomField);


materialConfirmationRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , deleteMaterialRoomFile);
materialConfirmationRoutes.post("/:projectId/uploads/:roomId", imageUploadToS3.array("files"), multiRoleAuthMiddleware("owner", "staff", "CTO",) , uploadMaterialRoomFiles);
materialConfirmationRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setMaterialConfirmationStageDeadline)
materialConfirmationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), materialSelectionCompletionStatus)


export default materialConfirmationRoutes;
