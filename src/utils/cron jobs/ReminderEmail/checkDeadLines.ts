// cron/checkDeadlines.ts
import cron from 'node-cron';
import { checkStageDeadlines } from './checkStageDeadLines';
import { RequirementFormModel } from '../../../models/Stage Models/requirment model/requirement.model';
import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import { SampleDesignModel } from '../../../models/Stage Models/sampleDesing model/sampleDesign.model';
import { TechnicalConsultationModel } from '../../../models/Stage Models/technical consulatation/technicalconsultation.model';
import MaterialRoomConfirmationModel from '../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';
import { CostEstimationModel } from '../../../models/Stage Models/Cost Estimation Model/costEstimation.model';
import PaymentConfirmationModel from '../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import OrderingMaterialModel from '../../../models/Stage Models/Ordering Material Model/orderingMaterial.model';
// import MaterialArrivalModel from '../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model';
import WorkMainStageScheduleModel from '../../../models/Stage Models/WorkTask Model/WorkTask.model';
import InstallationModel from '../../../models/Stage Models/installation model/Installation.model';
import { QualityCheckupModel } from '../../../models/Stage Models/QualityCheck Model/QualityCheck.model';
import { CleaningAndSanitationModel } from '../../../models/Stage Models/Cleaning Model/cleaning.model';
import { ProjectDeliveryModel } from '../../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model';
import MaterialArrivalModel from '../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model';
// Add more models as needed

cron.schedule('0 * * * *', async () => {
  await checkStageDeadlines(RequirementFormModel, 'Requirement Form Stage');
  await checkStageDeadlines(SiteMeasurementModel, 'Site Measurement Stage');
  await checkStageDeadlines(SampleDesignModel, 'Sample Design Stage');
  await checkStageDeadlines(TechnicalConsultationModel, 'Technical Consulation Stage');
  await checkStageDeadlines(MaterialRoomConfirmationModel, 'Mateiral Selection Stage');
  await checkStageDeadlines(CostEstimationModel, 'Cost Estimation Stage');
  await checkStageDeadlines(PaymentConfirmationModel, 'Payment Stage');
  await checkStageDeadlines(OrderingMaterialModel, 'Ordering Material Stage');
  await checkStageDeadlines(MaterialArrivalModel, 'Check Material Arrival Stage');
  await checkStageDeadlines(WorkMainStageScheduleModel, 'Work Schedule Stage');
  await checkStageDeadlines(InstallationModel, 'Installation Stage');
  await checkStageDeadlines(QualityCheckupModel, 'Quality Checkup');
  await checkStageDeadlines(CleaningAndSanitationModel, 'Cleaning Stage');
  await checkStageDeadlines(ProjectDeliveryModel, 'Project Delivery Stage');
});
