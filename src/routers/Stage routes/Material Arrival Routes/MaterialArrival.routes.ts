import express from "express";

// import { deleteMaterialArrivalRoomItem, generateMaterialArrivalLink, getAllMaterialArrivalDetails, getMaterialArrivalPublicDetails, getSingleRoomMaterialArrival, materialArrivalCompletionStatus, setMaterialArrivalStageDeadline, updateMaterialArrivalDeliveryLocation, updateMaterialArrivalRoomItem, updateMaterialArrivalShopDetails } from "../../../controllers/stage controllers/MaterialArrival controllers/materialArrivalCheck.controller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
// import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
// import OrderingMaterialModel from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
// import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
import { bulkToggleAllVerification, generateMaterialArrivalLink, getAllMaterialArrivalDetails, getMaterialArrivalPublicDetails, materialArrivalCompletionStatus, setMaterialArrivalStageDeadline, toggleMaterialVerification, updateMaterialArrivalItem } from "../../../controllers/stage controllers/MaterialArrival controllers/materialArrivalCheckNew.controller";
import { OrderMaterialHistoryModel } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";

const materialArrivalRoutes = express.Router();

// materialArrivalRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderingMaterialModel),notToUpdateIfStageCompleted(MaterialArrivalModel),  checkIfStaffIsAssignedToStage(MaterialArrivalModel),updateMaterialArrivalShopDetails);
// materialArrivalRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(OrderingMaterialModel),notToUpdateIfStageCompleted(MaterialArrivalModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel),updateMaterialArrivalDeliveryLocation);
// materialArrivalRoutes.put("/:projectId/room/:roomKey", checkPreviousStageCompleted(OrderingMaterialModel), notToUpdateIfStageCompleted(MaterialArrivalModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), imageUploadToS3.single("upload"), processUploadFiles, updateMaterialArrivalRoomItem);
// materialArrivalRoutes.delete("/:projectId/room/:roomKey/:itemId", checkPreviousStageCompleted(OrderingMaterialModel),notToUpdateIfStageCompleted(MaterialArrivalModel) , checkIfStaffIsAssignedToStage(MaterialArrivalModel),deleteMaterialArrivalRoomItem);
// materialArrivalRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client"), checkPreviousStageCompleted(OrderingMaterialModel),getAllMaterialArrivalDetails);
// materialArrivalRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",  "worker", "client"),checkPreviousStageCompleted(OrderingMaterialModel), getSingleRoomMaterialArrival);
// materialArrivalRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderingMaterialModel),notToUpdateIfStageCompleted(MaterialArrivalModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), generateMaterialArrivalLink);
// materialArrivalRoutes.get("/public/:projectId/:token", checkPreviousStageCompleted(OrderingMaterialModel),getMaterialArrivalPublicDetails);


// materialArrivalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderingMaterialModel),notToUpdateIfStageCompleted(MaterialArrivalModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), setMaterialArrivalStageDeadline)
// materialArrivalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderingMaterialModel), notToUpdateIfStageCompleted(MaterialArrivalModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel),materialArrivalCompletionStatus)


materialArrivalRoutes.put('/updateverification/:projectId/:unitName', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), toggleMaterialVerification)
materialArrivalRoutes.put('/updateImage/:projectId/:fieldId',checkPreviousStageCompleted(OrderMaterialHistoryModel),   imageUploadToS3.single("upload"), processUploadFiles, updateMaterialArrivalItem)

materialArrivalRoutes.put('/verifyall/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), bulkToggleAllVerification)
materialArrivalRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), getAllMaterialArrivalDetails)

materialArrivalRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), generateMaterialArrivalLink);
materialArrivalRoutes.get("/public/:projectId/:token", getMaterialArrivalPublicDetails);

materialArrivalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(MaterialArrivalModel), setMaterialArrivalStageDeadline)
materialArrivalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderMaterialHistoryModel),  checkIfStaffIsAssignedToStage(MaterialArrivalModel),materialArrivalCompletionStatus)


export default materialArrivalRoutes;
