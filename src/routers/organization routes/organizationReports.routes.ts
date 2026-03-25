
import express  from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { getOrgArrivalReport, getOrgOrderingReport, getOrgProjectsReport } from '../../controllers/organization controllers/organizationReports.controller';

const organizationReportRoutes = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
organizationReportRoutes.get('/get/order-material/:organizationId', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getOrgOrderingReport)
organizationReportRoutes.get('/get/material-arrival/:organizationId', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getOrgArrivalReport)
organizationReportRoutes.get('/get/projects/:organizationId', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getOrgProjectsReport)

export default organizationReportRoutes;