import express, { RequestHandler } from 'express';
import { refreshToken, registerUser, userlogin, userLogout, isAuthenticated, forgotPassword, resetForgotPassword, deleteuser } from '../controllers/auth controllers/auth.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';


const router = express.Router()

router.post('/login', userlogin as RequestHandler)
router.post('/registeruser', registerUser as RequestHandler)
router.post('/logout', userLogout as RequestHandler)
router.get('/refreshtoken', refreshToken as RequestHandler)
router.get('/isauthenticated', userAuthenticatedMiddleware, isAuthenticated as RequestHandler)
router.post('/forgotpassword', userAuthenticatedMiddleware, forgotPassword as RequestHandler)
router.post('/resetpassword', userAuthenticatedMiddleware, resetForgotPassword as RequestHandler)

router.delete('/deleteuser/:userId', deleteuser as RequestHandler)
export default router

