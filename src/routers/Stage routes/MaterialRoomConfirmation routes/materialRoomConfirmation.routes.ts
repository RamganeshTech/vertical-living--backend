import express from "express";
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import { sampleDesignCompletionStatus, setSampleDesignStageDeadline, uploadFilesToRoom } from "../../../controllers/stage controllers/sampledesign contorllers/sampledesign.controller";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { addOrUpdateMaterialItem, deleteMaterialRoomFile, deleteMaterialSubItem, deleteRoom, generatePdfMaterialPacakgeComparison, getMaterialByPackageLevel, getMaterialRoomConfirmationByProject, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, updateSelectedPackage, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
// import { addMaterialRoom, createModularWork, deleteMaterialRoom, deleteMaterialRoomFile, deleteModularWork, editModularWork, getAllMaterialRooms, getRoomById, materialSelectionCompletionStatus, setMaterialConfirmationStageDeadline, uploadMaterialRoomFiles } from "../../../controllers/stage controllers/material Room confirmation/materialRoomConfirmation.controller";


const materialConfirmationRoutes = express.Router();


// 📌 Get full material room confirmation stage for a project
materialConfirmationRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"),  getMaterialRoomConfirmationByProject);

// 📌 Get a single predefined room by roomId
// materialConfirmationRoutes.get("/:projectId/predefinedroom/:roomId/:roomType", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"), checkPreviousStageCompleted(TechnicalConsultationModel), getSinglePredefinedRoom);
materialConfirmationRoutes.get("/:projectId/singleroom/:packageId/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO", "client", "worker"),  getMaterialByPackageLevel);

// 📌 Update quantity, unit, and remarks of a predefined room field
// materialConfirmationRoutes.put("/:projectId/predefinedroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), updatePredefinedRoomField);

// 📌 Create a new custom room with name
// materialConfirmationRoutes.post("/:projectId/customroom", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel), notToUpdateIfStageCompleted(MaterialRoomConfirmationModel),  createCustomRoom);

materialConfirmationRoutes.patch("/:projectId/:packageId/:roomId/deleteroom", multiRoleAuthMiddleware("owner", "staff", "CTO"),  deleteRoom);
materialConfirmationRoutes.put("/additems/:projectId/:packageId/:roomId/:fieldId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  addOrUpdateMaterialItem);
materialConfirmationRoutes.delete("/deletesubitem/:projectId/:packageId/:roomId/:itemId/:fieldId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  deleteMaterialSubItem);
materialConfirmationRoutes.patch("/generatepdfcomparison/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  generatePdfMaterialPacakgeComparison);
materialConfirmationRoutes.patch("/updatepackage/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"),  updateSelectedPackage);



// 📌 Add a new item/field to an existing custom room
// materialConfirmationRoutes.post("/:projectId/customroom/:roomId/field", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel),  notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), addItemToCustomRoom);

// 📌 Delete a field (itemKey) from a custom room
// materialConfirmationRoutes.delete("/:projectId/customroom/:roomId/field/:fieldKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(TechnicalConsultationModel),  notToUpdateIfStageCompleted(MaterialRoomConfirmationModel), deleteCustomRoomField);


materialConfirmationRoutes.post("/:projectId/uploads/:packageId/:roomId",  multiRoleAuthMiddleware("owner", "staff", "CTO",), imageUploadToS3.array("files"), processUploadFiles, uploadMaterialRoomFiles);
materialConfirmationRoutes.patch("/:projectId/deleteuploadedfile/:packageId/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",), deleteMaterialRoomFile);

materialConfirmationRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  setMaterialConfirmationStageDeadline)
materialConfirmationRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  materialSelectionCompletionStatus)


export default materialConfirmationRoutes;
