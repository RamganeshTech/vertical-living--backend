import express , { RequestHandler } from "express"
import { getAccessedProjects, updateStatusProject } from "../../controllers/client controllers/clientApproval.controllers"

const router = express.Router()

router.get('/project/getaccessedprojects', getAccessedProjects as RequestHandler)
router.get('/project/getprojectdetails/:projectId', getAccessedProjects as RequestHandler)
router.patch('/project/changestatus', updateStatusProject as RequestHandler)

export default router;