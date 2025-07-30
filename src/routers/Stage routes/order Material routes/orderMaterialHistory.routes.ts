import  express  from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { checkPreviousStageCompleted } from '../../../middlewares/checkPreviousStageMiddleware';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';

import { notToUpdateIfStageCompleted } from '../../../middlewares/notToUpdateIfStageCompleted';
import { checkIfStaffIsAssignedToStage } from '../../../middlewares/checkIfStaffIsAssignedToStage';
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { getOrderHistoryMaterial, orderMaterialHistoryCompletionStatus, setOrderMaterialHistoryStageDeadline } from '../../../controllers/stage controllers/ordering material controller/orderMaterialHistory.controller';


const orderMaterialHistoryRoutes = express.Router()

orderMaterialHistoryRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO", "worker", "client"), checkPreviousStageCompleted(PaymentConfirmationModel), getOrderHistoryMaterial )
orderMaterialHistoryRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel),setOrderMaterialHistoryStageDeadline)
orderMaterialHistoryRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(PaymentConfirmationModel), notToUpdateIfStageCompleted(OrderMaterialHistoryModel), checkIfStaffIsAssignedToStage(OrderMaterialHistoryModel), orderMaterialHistoryCompletionStatus)



export default orderMaterialHistoryRoutes
