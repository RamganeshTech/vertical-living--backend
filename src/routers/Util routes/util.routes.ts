import express from "express";
import { getUtilProjectDetails } from "../../controllers/Util Controller/utilProject.controller";

const projectUtilRoutes = express.Router();

projectUtilRoutes.get("/getprojectdetails/:projectId", getUtilProjectDetails);


export default projectUtilRoutes;
