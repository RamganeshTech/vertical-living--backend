import express from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { updateProfile } from "../../controllers/Profile Role Controllers/updateProfileRole.controller";
import { getAllPreRequireties, getSinglePreRequirity, updatePreRequiretyBoolean, updatePreRequiretyNotes } from "../../controllers/PreRequireties Controllers/preRequireties.controllers";

const preRequiretiesRoutes = express.Router();


preRequiretiesRoutes.patch('/update/:id/notes/:section', multiRoleAuthMiddleware("staff", "owner","CTO"), updatePreRequiretyNotes);
preRequiretiesRoutes.patch('/update/:id/boolean/:section', multiRoleAuthMiddleware("staff", "owner","CTO"), updatePreRequiretyBoolean);
preRequiretiesRoutes.get('/getalldetails/:projectId', multiRoleAuthMiddleware("staff", "owner","CTO"), getAllPreRequireties);
// preRequiretiesRoutes.get('/getsingle/:projectId/:section', multiRoleAuthMiddleware("staff", "owner","CTO"), getSinglePreRequirity);

export default preRequiretiesRoutes;
