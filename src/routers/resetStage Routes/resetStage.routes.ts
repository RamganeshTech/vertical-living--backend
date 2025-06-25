import express  from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { resetStage1, resetStage2, resetStage3, resetStage4, resetStage5, resetStage6, resetStage7, resetStage8 } from '../../controllers/stage controllers/resetStage Controller/resetStage.controller';


const resetRouter = express.Router()

resetRouter.put('/stage1/requirementform/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage1)
resetRouter.put('/stage2/sitemeasurement/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage2)
resetRouter.put('/stage3/sampledesign/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage3)
resetRouter.put('/stage4/technicalconsultation/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage4)
resetRouter.put('/stage5/materialconfirmation/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage5)
resetRouter.put('/stage6/costestimation/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage6)
resetRouter.put('/stage7/paymentconfirmation/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage7)
resetRouter.put('/stage8/orderingmaterial/:projectId', multiRoleAuthMiddleware("staff", "admin", "CTO"), resetStage8)

export default resetRouter
