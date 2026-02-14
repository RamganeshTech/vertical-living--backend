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
import { bulkToggleAllVerification, deleteMaterialArrivalImagePublic, deleteMaterialArrivalImageV1, generateMaterialArrivalLink, getAllMaterialArrivalDetails, getMaterialArrivalPublicDetails, materialArrivalCompletionStatus, setMaterialArrivalStageDeadline, toggleMaterialVerification, updateMaterialArrivalImage, updateMaterialArrivalItem, updateMaterialArrivalItemV1, updateStaffMaterialArrivalQuantity, uploadMaterialArrivalImagesV1 } from "../../../controllers/stage controllers/MaterialArrival controllers/materialArrivalCheckNew.controller";
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


materialArrivalRoutes.put('/updateverification/:projectId/:orderNumber/:subItemId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), checkIfStaffIsAssignedToStage(MaterialArrivalModel), toggleMaterialVerification)
// materialArrivalRoutes.put('/updateImage/:projectId/:fieldId',   imageUploadToS3.single("upload"), processUploadFiles, updateMaterialArrivalItem)
//  not used currently but used in mobile
materialArrivalRoutes.put('/updateImage/:projectId/:orderNumber/:subItemId',   imageUploadToS3.single("upload"), processUploadFiles, updateMaterialArrivalItem)

materialArrivalRoutes.put(
  '/updateImage/v1/:projectId/:orderNumber/:subItemId', imageUploadToS3.array("upload", 10), processUploadFiles, updateMaterialArrivalItemV1
);

// Public delete route (No role restriction middleware)
materialArrivalRoutes.delete(
  '/deleteImage/v1/:projectId/:orderNumber/:subItemId/:imageId', 
  deleteMaterialArrivalImagePublic
);

materialArrivalRoutes.put('/updatequantity/:projectId/:orderNumber/:subItemId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), updateStaffMaterialArrivalQuantity)
// not used but used in the mobile version
materialArrivalRoutes.put('/uploadimage/staff/:projectId/:orderNumber/:subItemId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), imageUploadToS3.single("upload"), processUploadFiles, updateMaterialArrivalImage)

materialArrivalRoutes.put('/uploadimage/v1/staff/:projectId/:orderNumber/:subItemId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), imageUploadToS3.array("upload"), processUploadFiles, uploadMaterialArrivalImagesV1)
materialArrivalRoutes.patch('/deleteimage/v1/staff/:projectId/:orderNumber/:subItemId/:imageId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), deleteMaterialArrivalImageV1)

// not used 
materialArrivalRoutes.put('/verifyall/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(MaterialArrivalModel), bulkToggleAllVerification)

materialArrivalRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), getAllMaterialArrivalDetails)

materialArrivalRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), checkIfStaffIsAssignedToStage(MaterialArrivalModel), generateMaterialArrivalLink);
materialArrivalRoutes.get("/public/:projectId/:token", getMaterialArrivalPublicDetails);

materialArrivalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"), checkIfStaffIsAssignedToStage(MaterialArrivalModel), setMaterialArrivalStageDeadline)
materialArrivalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO","worker"),  checkIfStaffIsAssignedToStage(MaterialArrivalModel),materialArrivalCompletionStatus)


export default materialArrivalRoutes;
