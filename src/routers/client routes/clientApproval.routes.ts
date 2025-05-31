import express , { RequestHandler } from "express"
import { getAccessedProjects, updateMaterialStatus, updateMaterialListStatus, updateLabourListStatus, updateLabourStatus } from "../../controllers/client controllers/clientApproval.controllers"

const router = express.Router()

router.get('/project/getaccessedprojects', getAccessedProjects as RequestHandler)
router.get('/project/getprojectdetails/:projectId', getAccessedProjects as RequestHandler)

router.put('/project/updatematerialitemstatus/:materialListId/:materialItemId/:projectId', updateMaterialStatus as RequestHandler)
router.put('/project/updatematerialliststatus/:materialListId/:projectId', updateMaterialListStatus as RequestHandler)

router.put('/project/updatelabourliststatus/:labourListId/:labourItemId/:projectId', updateLabourStatus as RequestHandler)
router.put('/project/updatelabouritemstatus/:projectId/:labourListId', updateLabourListStatus as RequestHandler)

export default router;