import express, { RequestHandler } from 'express';
import { refreshToken, registerUser, userlogin, userLogout, isAuthenticated, forgotPassword, resetForgotPassword, deleteuser } from '../controllers/auth controllers/auth.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { loginStaff, registerStaff, staffLogout } from '../controllers/auth controllers/staff.controller';


const router = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
router.post('/login', userlogin as RequestHandler)
router.post('/registeruser', registerUser as RequestHandler)
router.post('/logout', userLogout as RequestHandler)
router.get('/refreshtoken', refreshToken as RequestHandler)
router.get('/isauthenticated', userAuthenticatedMiddleware, isAuthenticated as RequestHandler)
router.post('/forgotpassword', userAuthenticatedMiddleware, forgotPassword as RequestHandler)
router.post('/resetpassword', userAuthenticatedMiddleware, resetForgotPassword as RequestHandler)

router.delete('/deleteuser/:userId', deleteuser as RequestHandler)

// STAFFS ROUTES
router.post('/staff/login', loginStaff as RequestHandler)
router.post('/staff/registerstaff', registerStaff as RequestHandler)
router.post('/staff/logout', staffLogout as RequestHandler)

export default router

