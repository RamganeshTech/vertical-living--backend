import  express  from 'express';
import { addRoomMaterialItem, deleteOrderMaterialFile, deleteRoomMaterialItem, generateOrderingMaterialLink, getAllOrderingMaterialDetails, getOrderingMaterialPublicDetails,  getRoomDetailsOrderMaterials, orderMaterialCompletionStatus, setOrderMaterialFileStageDeadline, updateDeliveryLocationDetails, updateRoomMaterials, updateShopDetails, uploadOrderMaterialFiles } from '../../../controllers/stage controllers/ordering material controller/orderingMaterial.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3upload';
import OrderingMaterialModel from '../../../models/Stage Models/Ordering Material Model/orderingMaterial.model';
import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';


const orderMaterialRoutes = express.Router()

orderMaterialRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel),  notToUpdateIfStageCompleted(OrderingMaterialModel),updateShopDetails);

orderMaterialRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), updateDeliveryLocationDetails);

orderMaterialRoutes.put("/:projectId/room/:itemId/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), updateRoomMaterials);
orderMaterialRoutes.post("/:projectId/room/:roomKey/add", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), addRoomMaterialItem );

orderMaterialRoutes.delete("/:projectId/room/:roomKey/:itemId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), deleteRoomMaterialItem);

orderMaterialRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client") , checkPreviousStageCompleted(PaymentConfirmationModel),getAllOrderingMaterialDetails);

orderMaterialRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client") ,checkPreviousStageCompleted(PaymentConfirmationModel), getRoomDetailsOrderMaterials);

orderMaterialRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(PaymentConfirmationModel),  notToUpdateIfStageCompleted(OrderingMaterialModel), generateOrderingMaterialLink);

// Public GET route to view form using token
orderMaterialRoutes.get("/public/:projectId/:token",checkPreviousStageCompleted(PaymentConfirmationModel), getOrderingMaterialPublicDetails);


orderMaterialRoutes.post("/:projectId/uploads/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), imageUploadToS3.array("files"), uploadOrderMaterialFiles);
orderMaterialRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), deleteOrderMaterialFile);

orderMaterialRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel),setOrderMaterialFileStageDeadline)
orderMaterialRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderingMaterialModel), orderMaterialCompletionStatus)


export default orderMaterialRoutes
