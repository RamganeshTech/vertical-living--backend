import  express  from 'express';
import { deleteOrderMaterialFile, deleteRoomMaterialItem, generateOrderingMaterialLink, getAllOrderingMaterialDetails, getOrderingMaterialPublicDetails,  getRoomDetailsOrderMaterials, orderMaterialCompletionStatus, setOrderMaterialFileStageDeadline, updateDeliveryLocationDetails, updateRoomMaterials, updateShopDetails, uploadOrderMaterialFiles } from '../../../controllers/stage controllers/ordering material controller/orderingMaterial.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
// import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3upload';


const orderMaterialRoutes = express.Router()

orderMaterialRoutes.put("/:projectId/shop", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), updateShopDetails);

orderMaterialRoutes.put("/:projectId/delivery-location", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), updateDeliveryLocationDetails);

orderMaterialRoutes.put("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), updateRoomMaterials);

orderMaterialRoutes.delete("/:projectId/room/:roomKey/:itemId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , checkPreviousStageCompleted(PaymentConfirmationModel),deleteRoomMaterialItem);

orderMaterialRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , checkPreviousStageCompleted(PaymentConfirmationModel),getAllOrderingMaterialDetails);

orderMaterialRoutes.get("/:projectId/room/:roomKey", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), getRoomDetailsOrderMaterials);

orderMaterialRoutes.post("/:projectId/generate-link", multiRoleAuthMiddleware("owner", "staff", "CTO"),checkPreviousStageCompleted(PaymentConfirmationModel), generateOrderingMaterialLink);

// Public GET route to view form using token
orderMaterialRoutes.get("/public/:projectId/:token",checkPreviousStageCompleted(PaymentConfirmationModel), getOrderingMaterialPublicDetails);


orderMaterialRoutes.post("/:projectId/uploads/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), imageUploadToS3.array("files"), uploadOrderMaterialFiles);
orderMaterialRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) ,checkPreviousStageCompleted(PaymentConfirmationModel), deleteOrderMaterialFile);

orderMaterialRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel),setOrderMaterialFileStageDeadline)
orderMaterialRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(PaymentConfirmationModel), orderMaterialCompletionStatus)


export default orderMaterialRoutes
