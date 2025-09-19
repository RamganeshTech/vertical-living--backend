import express from 'express';
import { createWorkReport, deleteWorkReportById, getDailyTaskImagesByDate, getWorkReportsByProjectId } from '../../../controllers/stage controllers/workReport Controller/workReport.controller';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';


const workReportRoutes = express.Router()

workReportRoutes.post('/create/:projectId/:organizationId',  createWorkReport)
workReportRoutes.get("/getreports/:projectId", getWorkReportsByProjectId);
workReportRoutes.get("/workimages/:projectId/:id/:date/:dailyTaskId", getDailyTaskImagesByDate);
workReportRoutes.delete("/delete/:id", deleteWorkReportById);

// workReportRoutes.get("/proxyimage", proxyImageFromS3);

export default workReportRoutes

