import express from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { addItemToCustomRoom, createCustomRoom, deleteCustomRoomField, deleteMaterialRoomFile, deleteRoom, getMaterialRoomConfirmationByProject, getSinglePredefinedRoom, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, updatePredefinedRoomField, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
// import { addMaterialRoom, createModularWork, deleteMaterialRoom, deleteMaterialRoomFile, deleteModularWork, editModularWork, getAllMaterialRooms, getRoomById, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";


const materialConfirmationRoutes = express.Router();


// 📌 Get full material room confirmation stage for a project
materialConfirmationRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), checkPreviousStageCompleted(TechnicalConsultationModel), getMaterialRoomConfirmationByProject);

// 📌 Get a single predefined room by roomId
materialConfirmationRoutes.get("/:projectId/predefinedroom/:roomId/:roomType", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), checkPreviousStageCompleted(TechnicalConsultationModel), getSinglePredefinedRoom);

// 📌 Update quantity, unit, and remarks of a predefined room field
materialConfirmationRoutes.put("/:projectId/predefinedroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), updatePredefinedRoomField);

// 📌 Create a new custom room with name
materialConfirmationRoutes.post("/:projectId/customroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  createCustomRoom);

materialConfirmationRoutes.patch("/:projectId/:roomId/deleteroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  deleteRoom);

// 📌 Add a new item/field to an existing custom room
materialConfirmationRoutes.post("/:projectId/customroom/:roomId/field", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel),  notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), addItemToCustomRoom);

// 📌 Delete a field (itemKey) from a custom room
materialConfirmationRoutes.delete("/:projectId/customroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel),  notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), deleteCustomRoomField);


materialConfirmationRoutes.post("/:projectId/uploads/:roomId",  multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  imageUploadToS3.array("files"), processUploadFiles, uploadMaterialRoomFiles);
materialConfirmationRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  deleteMaterialRoomFile);

materialConfirmationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), setMaterialConfirmationStageDeadline)
materialConfirmationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  materialSelectionCompletionStatus)


export default materialConfirmationRoutes;
