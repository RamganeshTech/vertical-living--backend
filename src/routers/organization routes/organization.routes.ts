import express, { RequestHandler } from 'express';
import { createOrganziation, deleteOrganization, deleteUserById, getAllUsersByOrganization, getClientByProject, getCTOByOrganization, getMyOrganizations, getOrganizationById, getSingleUserById, getStaffsByOrganization, getWorkersByProject, inviteClient, inviteCTO, inviteStaff, inviteWorkerByStaff, registerUserWithoutLink, removeCTOFromOrganization, removeStaffFromOrganization, removeWorkerFromProject, updateOrganizationDetails, updateUserPermissions } from '../../controllers/organization controllers/organiziation.controllers';
import userAuthenticatedMiddleware from '../../middlewares/userAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const orgsRouter = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
orgsRouter.post('/createorganziation', multiRoleAuthMiddleware("owner"), createOrganziation as RequestHandler)
orgsRouter.get('/getorganizations', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getMyOrganizations as RequestHandler)
orgsRouter.get('/getsingleorganization/:orgs', multiRoleAuthMiddleware("owner", "CTO", "staff", "client", "worker"), getOrganizationById as RequestHandler)
orgsRouter.put('/updateorganization/:orgId', multiRoleAuthMiddleware("owner"), updateOrganizationDetails as RequestHandler)
orgsRouter.delete('/deleteorganization/:orgId', multiRoleAuthMiddleware("owner"), deleteOrganization as RequestHandler)

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
orgsRouter.put('/removeworker/:orgId/:workerId/:projectId', multiRoleAuthMiddleware("owner", "CTO", "staff"), removeWorkerFromProject as RequestHandler)


orgsRouter.post('/inviteclienttoproject', multiRoleAuthMiddleware("owner", "CTO"), inviteClient)
orgsRouter.get('/getclientsofproject/:orgId/:projectId', multiRoleAuthMiddleware("CTO", "staff", "owner"), getClientByProject)



orgsRouter.post('/registeruser/:organizationId/:role', multiRoleAuthMiddleware("owner"), registerUserWithoutLink)
orgsRouter.put('/updatepermission/:userId', multiRoleAuthMiddleware("owner"), updateUserPermissions)
orgsRouter.get('/getalluser/:organizationId', multiRoleAuthMiddleware("owner"), getAllUsersByOrganization)
orgsRouter.get('/getsingleuser/:userId', multiRoleAuthMiddleware("owner"), getSingleUserById)
orgsRouter.delete('/deleteuser/:userId', multiRoleAuthMiddleware("owner"), deleteUserById)


export default orgsRouter

