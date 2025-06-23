// cron/checkDeadlines.ts
import cron from 'node-cron';
import { checkStageDeadlines } from './checkStageDeadLines'; 
import { RequirementFormModel } from '../../models/Stage Models/requirment model/requirement.model'; 
import { SiteMeasurementModel } from '../../models/Stage Models/siteMeasurement models/siteMeasurement.model'; 
// Add more models as needed

cron.schedule('0 * * * *', async () => {
  await checkStageDeadlines(RequirementFormModel, 'Requirement Form');
  await checkStageDeadlines(SiteMeasurementModel, 'Site Measurement');
  // Add more as needed
});
