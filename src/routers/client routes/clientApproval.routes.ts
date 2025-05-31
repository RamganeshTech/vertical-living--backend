import express , { RequestHandler } from "express"
import { getAccessedProjects, updateMaterialStatus, updateMaterialListStatus } from "../../controllers/client controllers/clientApproval.controllers"

const router = express.Router()

router.get('/project/getaccessedprojects', getAccessedProjects as RequestHandler)
router.get('/project/getprojectdetails/:projectId', getAccessedProjects as RequestHandler)
router.put('/project/updatematerialstatus', updateMaterialStatus as RequestHandler)
router.put('/project/updatematerialliststatus', updateMaterialListStatus as RequestHandler)

export default router;