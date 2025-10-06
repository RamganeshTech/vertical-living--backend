import { Router } from "express";
import { createWorkLibrary,
  updateWorkLibrary,
  getWorkLibraryById,
  getWorkLibrariesByOrgId,
  deleteWorkLibrary } from "../../controllers/WorkLibrary Controllers/workLibrary.controllers";
  import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";


const workLibRoutes = Router()

// 🔸 Create a new work library
workLibRoutes.post('/creatework',multiRoleAuthMiddleware("CTO", "staff", "owner"), createWorkLibrary);

// 🔸 Update entire work library (name, tasks, subtasks etc.)
workLibRoutes.put('/update/:id', multiRoleAuthMiddleware("CTO", "staff", "owner"),updateWorkLibrary);

// 🔸 Get a single work library by ID
workLibRoutes.get('/getsinglework/:id',multiRoleAuthMiddleware("CTO", "staff", "owner"), getWorkLibraryById);

// 🔸 Get all work libraries for an organization
workLibRoutes.get('/getallwork/:orgId',multiRoleAuthMiddleware("CTO", "staff", "owner"), getWorkLibrariesByOrgId);

// 🔸 Delete a work library completely
workLibRoutes.delete('/delete/:id',multiRoleAuthMiddleware("CTO", "staff", "owner"), deleteWorkLibrary);

export default workLibRoutes;