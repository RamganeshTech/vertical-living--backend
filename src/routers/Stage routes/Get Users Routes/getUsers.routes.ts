import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getUsers } from "../../../controllers/stage controllers/Get Users controllers/getUsers.controller";

const getUsersRoutes = Router()

getUsersRoutes.get('/:organizationId/:role', multiRoleAuthMiddleware("CTO", "staff", "owner"), getUsers)

export default getUsersRoutes