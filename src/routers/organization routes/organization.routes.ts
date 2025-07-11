import express, { RequestHandler } from 'express';
import { createOrganziation, deleteOrganization, getClientByProject, getCTOByOrganization, getMyOrganizations, getOrganizationById, getStaffsByOrganization, getWorkersByProject, inviteClient, inviteCTO, inviteStaff, inviteWorkerByStaff, removeCTOFromOrganization, removeStaffFromOrganization, removeWorkerFromProject, updateOrganizationDetails } from '../../controllers/organization controllers/organiziation.controllers';
import userAuthenticatedMiddleware from '../../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const orgsRouter = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
orgsRouter.post('/createorganziation', multiRoleAuthMiddleware("owner"), createOrganziation as RequestHandler)
orgsRouter.get('/getorganizations', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getMyOrganizations as RequestHandler)
orgsRouter.get('/getsingleorganization/:orgs', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getOrganizationById as RequestHandler)
orgsRouter.put('/updateorganization/:orgId', multiRoleAuthMiddleware("owner"), updateOrganizationDetails as RequestHandler)
orgsRouter.put('/deleteorganization/:orgId', multiRoleAuthMiddleware("owner"), deleteOrganization as RequestHandler)

// inviting staff for organnization
orgsRouter.get('/getstaffsoforganization/:orgId', multiRoleAuthMiddleware("owner", "CTO", "staff"), getStaffsByOrganization as RequestHandler)
orgsRouter.post('/invitestafftoorganization', multiRoleAuthMiddleware("owner", "CTO"), inviteStaff as RequestHandler)
orgsRouter.patch('/removestafffromorganziation', multiRoleAuthMiddleware("owner", "CTO"), removeStaffFromOrganization as RequestHandler)


// inviting CTO for organization
orgsRouter.get('/getctooforganization/:orgId', multiRoleAuthMiddleware("owner", "CTO", "staff"), getCTOByOrganization as RequestHandler)
orgsRouter.post('/invitectotoorganization', multiRoleAuthMiddleware("owner"), inviteCTO as RequestHandler)
orgsRouter.patch('/removectofromorganziation', multiRoleAuthMiddleware("owner"), removeCTOFromOrganization as RequestHandler)

// INVITE FOR WORKER FOR PROJECT
orgsRouter.post('/inviteworker/', multiRoleAuthMiddleware("owner", "CTO", "staff"), inviteWorkerByStaff as RequestHandler)
orgsRouter.get('/getworker/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), getWorkersByProject as RequestHandler)
orgsRouter.put('/removeworker/:workerId/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), removeWorkerFromProject as RequestHandler)


orgsRouter.post('/inviteclienttoproject', multiRoleAuthMiddleware("owner", "CTO"), inviteClient)
orgsRouter.get('/getclientsofproject/:orgId/:projectId', multiRoleAuthMiddleware("CTO", "staff", "owner"), getClientByProject)


export default orgsRouter

