import express from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { updateProfile } from "../../controllers/Profile Role Controllers/updateProfileRole.controller";
import { getAllPreRequireties, getSinglePreRequirity, updatePreRequiretyBoolean, updatePreRequiretyNotes } from "../../controllers/PreRequireties Controllers/preRequireties.controllers";
import { getBrandsByCategory } from "../../controllers/Util Controller/getCommonData.controller";

const utilAiRoutes = express.Router();

utilAiRoutes.get("/brands/:category", getBrandsByCategory);


export default utilAiRoutes;
