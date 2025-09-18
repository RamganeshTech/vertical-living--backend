import express from 'express';
import { createWorkReport, deleteWorkReportById, getDailyTaskImagesByDate, getWorkReportsByProjectId } from '../../../controllers/stage controllers/workReport Controller/workReport.controller';


const workReportRoutes = express.Router()

workReportRoutes.post('/create/:projectId/:organizationId', createWorkReport)
workReportRoutes.get("/getreports/:projectId", getWorkReportsByProjectId);
workReportRoutes.get("/workimages/:projectId/:id/:date/:dailyTaskId", getDailyTaskImagesByDate);
workReportRoutes.delete("/delete/:id", deleteWorkReportById);

export default workReportRoutes

