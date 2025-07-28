import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { addSelectedDesignsToShortlist, getShortlistedRoomDesigns, removeShortlistedDesign, uploadShortlistedRoomImages } from "../../../controllers/stage controllers/sampledesign contorllers/shortList.controller";


const shortlistedDesignRoutes = express.Router();

shortlistedDesignRoutes.post(
  "/upload/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.array("file"),
  processUploadFiles,
  uploadShortlistedRoomImages
);



shortlistedDesignRoutes.post(
  "/addexising/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  addSelectedDesignsToShortlist
);


shortlistedDesignRoutes.delete(
 "/remove/:projectId/:_id/:roomName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  removeShortlistedDesign
);


shortlistedDesignRoutes.get(
  "/getroom/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getShortlistedRoomDesigns
);


export default shortlistedDesignRoutes;
