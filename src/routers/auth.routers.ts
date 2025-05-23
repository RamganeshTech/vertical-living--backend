import express, { RequestHandler }  from 'express';
import { refreshToken, registerUser, userlogin, userLogout, isAuthenticated, forgotPassword, resetForgotPassword } from '../controllers/auth.controller';


const router = express.Router()

router.post('/login', userlogin as RequestHandler)
router.post('/registeruser', registerUser as RequestHandler)
router.post('/logout', userLogout as RequestHandler)
router.get('/refreshtoken', refreshToken as RequestHandler)
router.get('isauthenticated', isAuthenticated as RequestHandler)
router.post('forgotpassword', forgotPassword as RequestHandler)
router.post('resetpassword', resetForgotPassword as RequestHandler)
export default router

