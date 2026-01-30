import express, { RequestHandler } from 'express';
import { unifiedForgotPassword, unifiedLogin, unifiedRegister, unifiedResetForgotPassword } from '../../controllers/auth controllers/commonAuth.controllers';


const CommonAuthRoutes = express.Router()

//THIS IS FOR COMMON AUTH USERS WHO ARE ALL ARE NEEDED TO WORK ON THE THINGS 
CommonAuthRoutes.post('/login', unifiedLogin)
CommonAuthRoutes.post('/registeruser', unifiedRegister)
CommonAuthRoutes.post('/forgotpassword', unifiedForgotPassword as RequestHandler)
CommonAuthRoutes.post('/resetpassword', unifiedResetForgotPassword as RequestHandler)

export default CommonAuthRoutes;