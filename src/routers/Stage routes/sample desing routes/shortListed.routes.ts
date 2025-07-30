import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { addSelectedDesignsToShortlist, deleteShortlistedDesign, getShortlistedRoomDesigns, uploadShortlistedDesignImages } from "../../../controllers/stage controllers/sampledesign contorllers/shortList.controller";


const shortlistedDesignRoutes = express.Router();

shortlistedDesignRoutes.post(
  "/upload/:projectId/:roomName/:categoryName/:categoryId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.array("file"),
  processUploadFiles,
  uploadShortlistedDesignImages
);



shortlistedDesignRoutes.post(
  "/addexising/:projectId/:roomName/:categoryName/:categoryId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  addSelectedDesignsToShortlist
);


shortlistedDesignRoutes.delete(
 "/remove/:projectId/:roomName/:imageId/:categoryId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteShortlistedDesign
);


shortlistedDesignRoutes.get(
  "/getroom/:projectId/:roomName",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getShortlistedRoomDesigns
);


export default shortlistedDesignRoutes;
