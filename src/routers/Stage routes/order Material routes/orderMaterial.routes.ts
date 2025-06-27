import  express  from 'express';
import { deleteOrderMaterialFile, deleteRoomMaterialItem, generateOrderingMaterialLink, getAllOrderingMaterialDetails, getOrderingMaterialPublicDetails,  getRoomDetailsOrderMaterials, orderMaterialCompletionStatus, setOrderMaterialFileStageDeadline, updateDeliveryLocationDetails, updateRoomMaterials, updateShopDetails, uploadOrderMaterialFiles } from '../../../controllers/stage controllers/ordering material controller/orderingMaterial.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';


const orderMaterialRoutes = express.Router()

orderMaterialRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO",) , updateShopDetails);

orderMaterialRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO",) , updateDeliveryLocationDetails);

orderMaterialRoutes.put("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",) , updateRoomMaterials);

orderMaterialRoutes.delete("/:projectId/room/:roomKey/:itemId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , deleteRoomMaterialItem);

orderMaterialRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , getAllOrderingMaterialDetails);

orderMaterialRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",) , getRoomDetailsOrderMaterials);

orderMaterialRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"), generateOrderingMaterialLink);

// Public GET route to view form using token
orderMaterialRoutes.get("/public/:projectId/:token", getOrderingMaterialPublicDetails);


orderMaterialRoutes.post("/:projectId/uploads/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , imageUploadToS3.array("files"), uploadOrderMaterialFiles);
orderMaterialRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , deleteOrderMaterialFile);

orderMaterialRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setOrderMaterialFileStageDeadline)
orderMaterialRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), orderMaterialCompletionStatus)


export default orderMaterialRoutes
