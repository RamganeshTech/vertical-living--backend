import express, { RequestHandler } from 'express';
import { refreshToken, registerUser, userlogin, userLogout, isAuthenticated, forgotPassword, resetForgotPassword, deleteuser } from '../controllers/auth controllers/auth.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { loginStaff, refreshTokenStaff, registerStaff, staffIsAuthenticated, staffLogout } from '../controllers/auth controllers/staffAuth.controller';
import { loginWorker, refreshTokenWorker, registerWorker, workerIsAuthenticated, workerLogout } from '../controllers/auth controllers/workerAuth.controller';
import staffAuthenticatedMiddleware from '../middlewares/staffAuthMiddleware';
import workerAuthenticatedMiddleware from '../middlewares/workerAuthMiddleware';


const authRoutes = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
authRoutes.post('/login', userlogin as RequestHandler)
authRoutes.post('/registeruser', registerUser as RequestHandler)
authRoutes.post('/logout', userLogout as RequestHandler)
authRoutes.get('/refreshtoken', refreshToken as RequestHandler)
authRoutes.get('/isauthenticated', userAuthenticatedMiddleware, isAuthenticated as RequestHandler)
authRoutes.post('/forgotpassword', userAuthenticatedMiddleware, forgotPassword as RequestHandler)
authRoutes.post('/resetpassword', userAuthenticatedMiddleware, resetForgotPassword as RequestHandler)

authRoutes.delete('/deleteuser/:userId', deleteuser as RequestHandler)

// STAFFS ROUTES
authRoutes.post('/staff/login', loginStaff as RequestHandler)
authRoutes.post('/staff/registerstaff', registerStaff as RequestHandler)
authRoutes.post('/staff/logout', staffLogout as RequestHandler)
authRoutes.get('/staff/refreshtoken', refreshTokenStaff as RequestHandler)
authRoutes.get('/staff/isauthenticated', staffAuthenticatedMiddleware, staffIsAuthenticated as RequestHandler)


// WORKER ROUTES
authRoutes.post('/worker/login', loginWorker as RequestHandler)
authRoutes.post('/worker/registerworker', registerWorker as RequestHandler)
authRoutes.post('/worker/logout', workerLogout as RequestHandler)
authRoutes.get('/worker/refreshtoken', refreshTokenWorker as RequestHandler)
authRoutes.get('/worker/isauthenticated', workerAuthenticatedMiddleware, workerIsAuthenticated as RequestHandler)




export default authRoutes

