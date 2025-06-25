import  express  from 'express';
import { deleteOrderMaterialFile, getOrderingMaterialStageData, getSingleOrderingRoomData, orderMaterialCompletionStatus, setOrderMaterialFileStageDeadline, updateOrderMaterialIsOrdered, updateOrderMaterialItem, uploadOrderMaterialFiles } from '../../../controllers/stage controllers/ordering material controller/orderingMaterial.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3 } from '../../../utils/s3Uploads/s3ImageUploader';


const orderMaterialRoutes = express.Router()

orderMaterialRoutes.patch("/:projectId/room/:roomId/material/:materialName", multiRoleAuthMiddleware("owner", "staff", "CTO"), updateOrderMaterialItem);
orderMaterialRoutes.patch("/:projectId/room/:roomId/material/:materialName/ordered", multiRoleAuthMiddleware("owner", "staff", "CTO"),updateOrderMaterialIsOrdered);
orderMaterialRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getOrderingMaterialStageData);
orderMaterialRoutes.get("/:projectId/room/:roomId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getSingleOrderingRoomData);



orderMaterialRoutes.post("/:projectId/uploads/:roomId", imageUploadToS3.array("files"), multiRoleAuthMiddleware("owner", "staff", "CTO",) , uploadOrderMaterialFiles);
orderMaterialRoutes.patch("/:projectId/deleteuploadedfile/:roomId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO",) , deleteOrderMaterialFile);

orderMaterialRoutes.put('/deadline/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), setOrderMaterialFileStageDeadline)
orderMaterialRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), orderMaterialCompletionStatus)


export default orderMaterialRoutes
