import express, { RequestHandler } from 'express';
import { createOrganziation, deleteOrganization, getMyOrganizations, getOrganizationById, getStaffsByOrganization, inviteStaff, removeStaffFromOrganization, updateOrganizationDetails } from '../../controllers/organization controllers/organiziation.controllers';
import userAuthenticatedMiddleware from '../../middlewares/userAuthMiddleware';


const orgsRouter = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
orgsRouter.post('/createorganziation',userAuthenticatedMiddleware, createOrganziation as RequestHandler)
orgsRouter.get('/getorganizations',userAuthenticatedMiddleware, getMyOrganizations as RequestHandler)
orgsRouter.get('/getsingleorganization/:orgs',userAuthenticatedMiddleware, getOrganizationById as RequestHandler)
orgsRouter.put('/updateorganization/:orgId',userAuthenticatedMiddleware, updateOrganizationDetails as RequestHandler)
orgsRouter.put('/deleteorganization/:orgId',userAuthenticatedMiddleware, deleteOrganization as RequestHandler)
orgsRouter.get('/getstaffsoforganization/:orgId', userAuthenticatedMiddleware, getStaffsByOrganization as RequestHandler)
orgsRouter.post('/invitestafftoorganization', userAuthenticatedMiddleware, inviteStaff as RequestHandler)
orgsRouter.patch('/removestafffromorganziation', userAuthenticatedMiddleware, removeStaffFromOrganization as RequestHandler)

export default orgsRouter

