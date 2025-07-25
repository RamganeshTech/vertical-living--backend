import express, { RequestHandler } from 'express';
import { refreshToken, registerUser, userlogin, userLogout, isAuthenticated, forgotPassword, resetForgotPassword, deleteuser } from '../controllers/auth controllers/auth.controller';
import userAuthenticatedMiddleware from '../middlewares/userAuthMiddleware';
import { loginStaff, refreshTokenStaff, registerStaff, staffforgotPassword, staffIsAuthenticated, staffLogout, staffResetForgotPassword } from '../controllers/auth controllers/staffAuth.controller';
import { loginWorker, refreshTokenWorker, registerWorker, workerforgotPassword, workerIsAuthenticated, workerLogout, workerResetForgotPassword } from '../controllers/auth controllers/workerAuth.controller';
import staffAuthenticatedMiddleware from '../middlewares/staffAuthMiddleware';
import workerAuthenticatedMiddleware from '../middlewares/workerAuthMiddleware';
import CTOAuthenticatedMiddleware from '../middlewares/CTOAuthMiddleware';
import { CTOforgotPassword, CTOIsAuthenticated, CTOLogout, CTOResetForgotPassword, loginCTO, refreshTokenCTO, registerCTO } from '../controllers/auth controllers/CTOAuth.controller';
import { multiRoleAuthMiddleware } from '../middlewares/multiRoleAuthMiddleware';


const authRoutes = express.Router()

// PORDUCT OWNER OR ORGANIZATION OWNER ROUTES
authRoutes.post('/login', userlogin as RequestHandler)
authRoutes.post('/registeruser', registerUser as RequestHandler)
authRoutes.post('/logout', userLogout as RequestHandler)
authRoutes.get('/refreshtoken', refreshToken as RequestHandler)
authRoutes.get('/isauthenticated', multiRoleAuthMiddleware("owner"), isAuthenticated as RequestHandler)
authRoutes.post('/forgotpassword', forgotPassword as RequestHandler)
authRoutes.post('/resetpassword', resetForgotPassword as RequestHandler)

authRoutes.delete('/deleteuser/:userId', deleteuser as RequestHandler)

    
// STAFFS ROUTES
authRoutes.post('/staff/login', loginStaff as RequestHandler)
authRoutes.post('/staff/registerstaff', registerStaff as RequestHandler)
authRoutes.post('/staff/logout', staffLogout as RequestHandler)
authRoutes.get('/staff/refreshtoken', refreshTokenStaff as RequestHandler)
authRoutes.get('/staff/isauthenticated',  multiRoleAuthMiddleware("staff"), staffIsAuthenticated as RequestHandler)
authRoutes.post('/staff/forgotpassword',  staffforgotPassword as RequestHandler)
authRoutes.post('/staff/resetpassword',  staffResetForgotPassword as RequestHandler)



// WORKER ROUTES
authRoutes.post('/worker/login', loginWorker as RequestHandler)
authRoutes.post('/worker/registerworker', registerWorker as RequestHandler)
authRoutes.post('/worker/logout', workerLogout as RequestHandler)
authRoutes.get('/worker/refreshtoken', refreshTokenWorker as RequestHandler)
authRoutes.get('/worker/isauthenticated',  multiRoleAuthMiddleware("worker"), workerIsAuthenticated as RequestHandler)
authRoutes.post('/worker/forgotpassword', workerforgotPassword as RequestHandler)
authRoutes.post('/worker/resetpassword', workerResetForgotPassword as RequestHandler)




// CTO ROUTES
authRoutes.post('/CTO/login', loginCTO as RequestHandler)
authRoutes.post('/CTO/registerCTO', registerCTO as RequestHandler)
authRoutes.post('/CTO/logout', CTOLogout as RequestHandler)
authRoutes.get('/CTO/refreshtoken', refreshTokenCTO as RequestHandler)
authRoutes.get('/CTO/isauthenticated',  multiRoleAuthMiddleware("CTO"), CTOIsAuthenticated as RequestHandler)
authRoutes.post('/CTO/forgotpassword', CTOforgotPassword as RequestHandler)
authRoutes.post('/CTO/resetpassword', CTOResetForgotPassword as RequestHandler)





export default authRoutes

