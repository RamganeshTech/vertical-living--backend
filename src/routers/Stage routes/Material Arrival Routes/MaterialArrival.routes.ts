import express from "express";

import { deleteMaterialArrivalRoomItem, generateMaterialArrivalLink, getAllMaterialArrivalDetails, getMaterialArrivalPublicDetails, getSingleRoomMaterialArrival, materialArrivalCompletionStatus, setMaterialArrivalStageDeadline, updateMaterialArrivalDeliveryLocation, updateMaterialArrivalRoomItem, updateMaterialArrivalShopDetails } from "../../../controllers/stage controllers/MaterialArrival controllers/materialArrivalCheck.controller";
import { multiRoleAuthMiddleware } from './../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from "../../../utils/s3Uploads/s3ImageUploader";

const materialArrivalRoutes = express.Router();

materialArrivalRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateMaterialArrivalShopDetails);
materialArrivalRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateMaterialArrivalDeliveryLocation);
materialArrivalRoutes.put("/:projectId/room/:roomKey",  imageUploadToS3.single("upload"), updateMaterialArrivalRoomItem);
materialArrivalRoutes.delete("/:projectId/room/:roomKey/:itemId", deleteMaterialArrivalRoomItem);
materialArrivalRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllMaterialArrivalDetails);
materialArrivalRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO"), getSingleRoomMaterialArrival);
materialArrivalRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"), generateMaterialArrivalLink);
materialArrivalRoutes.get("/public/:projectId/:token", getMaterialArrivalPublicDetails);


materialArrivalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setMaterialArrivalStageDeadline)
materialArrivalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), materialArrivalCompletionStatus)

export default materialArrivalRoutes;
