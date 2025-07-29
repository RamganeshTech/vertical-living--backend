import express  from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { resetStage1, resetStage10, resetStage11, resetStage12, resetStage13, resetStage14, resetStage2, resetStage3, resetStage4, resetStage5, resetStage6, resetStage7, resetStage8, resetStage9 } from '../../controllers/stage controllers/resetStage Controller/resetStage.controller';
import { RequirementFormModel } from '../../models/Stage Models/requirment model/requirement.model';
import { notToUpdateIfStageCompleted } from '../../middlewares/notToUpdateIfStageCompleted';
import { SiteMeasurementModel } from '../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import { SampleDesignModel } from '../../models/Stage Models/sampleDesing model/sampleDesign.model';
import { TechnicalConsultationModel } from '../../models/Stage Models/technical consulatation/technicalconsultation.model';
import MaterialRoomConfirmationModel from '../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';
import PaymentConfirmationModel from '../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import OrderingMaterialModel from '../../models/Stage Models/Ordering Material Model/orderingMaterial.model';
// import MaterialArrivalModel from '../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model';
import WorkMainStageScheduleModel from '../../models/Stage Models/WorkTask Model/WorkTask.model';
import InstallationModel from '../../models/Stage Models/installation model/Installation.model';
import { QualityCheckupModel } from '../../models/Stage Models/QualityCheck Model/QualityCheck.model';
import { CleaningAndSanitationModel } from '../../models/Stage Models/Cleaning Model/cleaning.model';
import { CostEstimationModel } from '../../models/Stage Models/Cost Estimation Model/costEstimation.model';
import { ProjectDeliveryModel } from '../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model';
import { checkPreviousStageCompleted } from '../../middlewares/checkPreviousStageMiddleware';
import MaterialArrivalModel from '../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model';


const resetRouter = express.Router()

resetRouter.put('/stage1/requirementform/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), resetStage1)
resetRouter.put('/stage2/sitemeasurement/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(RequirementFormModel),  resetStage2)
resetRouter.put('/stage3/sampledesign/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(SiteMeasurementModel),  resetStage3)
resetRouter.put('/stage4/technicalconsultation/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(SampleDesignModel),  resetStage4)
resetRouter.put('/stage5/materialconfirmation/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"),  checkPreviousStageCompleted(TechnicalConsultationModel), resetStage5)
resetRouter.put('/stage6/costestimation/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"),  checkPreviousStageCompleted(MaterialRoomConfirmationModel), resetStage6)
resetRouter.put('/stage7/paymentconfirmation/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(CostEstimationModel),  resetStage7)
resetRouter.put('/stage8/orderingmaterial/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(PaymentConfirmationModel),  resetStage8)
resetRouter.put('/stage9/materialarrivalcheck/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(OrderingMaterialModel),  resetStage9)
resetRouter.put('/stage10/worktasks/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(MaterialArrivalModel),  resetStage10)
resetRouter.put('/stage11/installation/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(WorkMainStageScheduleModel),  resetStage11)
resetRouter.put('/stage12/qualitycheck/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(InstallationModel),  resetStage12)
resetRouter.put('/stage13/cleaning/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(QualityCheckupModel),  resetStage13)
resetRouter.put('/stage14/projectdelivery/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(CleaningAndSanitationModel),  resetStage14)

export default resetRouter
