import express from "express";

import { deleteMaterialArrivalRoomItem, generateMaterialArrivalLink, getAllMaterialArrivalDetails, getMaterialArrivalPublicDetails, getSingleRoomMaterialArrival, materialArrivalCompletionStatus, setMaterialArrivalStageDeadline, updateMaterialArrivalDeliveryLocation, updateMaterialArrivalRoomItem, updateMaterialArrivalShopDetails } from "../../../controllers/stage controllers/MaterialArrival controllers/materialArrivalCheck.controller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";
import OrderingMaterialModel from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";

const materialArrivalRoutes = express.Router();

materialArrivalRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderingMaterialModel), updateMaterialArrivalShopDetails);
materialArrivalRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(OrderingMaterialModel),updateMaterialArrivalDeliveryLocation);
materialArrivalRoutes.put("/:projectId/room/:roomKey", checkPreviousStageCompleted(OrderingMaterialModel), imageUploadToS3.single("upload"), updateMaterialArrivalRoomItem);
materialArrivalRoutes.delete("/:projectId/room/:roomKey/:itemId", checkPreviousStageCompleted(OrderingMaterialModel),deleteMaterialArrivalRoomItem);
materialArrivalRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), checkPreviousStageCompleted(OrderingMaterialModel),getAllMaterialArrivalDetails);
materialArrivalRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderingMaterialModel), getSingleRoomMaterialArrival);
materialArrivalRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(OrderingMaterialModel), generateMaterialArrivalLink);
materialArrivalRoutes.get("/public/:projectId/:token", checkPreviousStageCompleted(OrderingMaterialModel),getMaterialArrivalPublicDetails);


materialArrivalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderingMaterialModel), setMaterialArrivalStageDeadline)
materialArrivalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(OrderingMaterialModel), materialArrivalCompletionStatus)

export default materialArrivalRoutes;
