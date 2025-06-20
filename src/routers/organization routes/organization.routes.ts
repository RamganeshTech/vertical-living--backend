import express, { RequestHandler } from 'express';
import { createOrganziation, deleteOrganization, getCTOByOrganization, getMyOrganizations, getOrganizationById, getStaffsByOrganization, inviteClient, inviteCTO, inviteStaff, removeCTOFromOrganization, removeStaffFromOrganization, updateOrganizationDetails } from '../../controllers/organization controllers/organiziation.controllers';
import userAuthenticatedMiddleware from '../../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const orgsRouter = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
orgsRouter.post('/createorganziation',userAuthenticatedMiddleware, createOrganziation as RequestHandler)
orgsRouter.get('/getorganizations',userAuthenticatedMiddleware, getMyOrganizations as RequestHandler)
orgsRouter.get('/getsingleorganization/:orgs',userAuthenticatedMiddleware, getOrganizationById as RequestHandler)
orgsRouter.put('/updateorganization/:orgId',userAuthenticatedMiddleware, updateOrganizationDetails as RequestHandler)
orgsRouter.put('/deleteorganization/:orgId',userAuthenticatedMiddleware, deleteOrganization as RequestHandler)

// inviting staff for organnization
orgsRouter.get('/getstaffsoforganization/:orgId', userAuthenticatedMiddleware, getStaffsByOrganization as RequestHandler)
orgsRouter.post('/invitestafftoorganization', userAuthenticatedMiddleware, inviteStaff as RequestHandler)
orgsRouter.patch('/removestafffromorganziation', userAuthenticatedMiddleware, removeStaffFromOrganization as RequestHandler)


// inviting CTO for organization
orgsRouter.get('/getctooforganization/:orgId', userAuthenticatedMiddleware, getCTOByOrganization as RequestHandler)
orgsRouter.post('/invitectotoorganization', userAuthenticatedMiddleware, inviteCTO as RequestHandler)
orgsRouter.patch('/removectofromorganziation', userAuthenticatedMiddleware, removeCTOFromOrganization as RequestHandler)

orgsRouter.post('/inviteclienttoproject', multiRoleAuthMiddleware("owner", "CTO"), inviteClient )



export default orgsRouter

