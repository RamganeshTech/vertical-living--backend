import express, { RequestHandler } from 'express';
import { clientForgotPassword, clientLogin, clientLogout, clientRefreshToken,
     clientResetForgotPassword, deleteClient, isClientAuthenticated, registerClient, 
     updateClientProfile} from '../../controllers/auth controllers/clientAuth.controller';
import ClientAuthMiddleware from './../../middlewares/clientAuthMiddleware';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';


const router = express.Router()

router.post('/login', clientLogin as RequestHandler)
router.post('/registerclient', registerClient as RequestHandler) //?invite= query requried
router.post('/logout', clientLogout as RequestHandler)
router.get('/refreshtoken', clientRefreshToken as RequestHandler)
router.get('/isauthenticated',  multiRoleAuthMiddleware("client"), isClientAuthenticated as RequestHandler)
router.post('/forgotpassword',  clientForgotPassword as RequestHandler)
router.post('/resetpassword',  clientResetForgotPassword as RequestHandler)

// not used yet
router.put('/updateclientinfo', ClientAuthMiddleware, updateClientProfile as RequestHandler)

router.delete('/deleteclient/:clientId', deleteClient as RequestHandler)
export default router

