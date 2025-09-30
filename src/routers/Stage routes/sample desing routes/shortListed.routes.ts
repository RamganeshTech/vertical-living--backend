import express from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
// import { addSelectedDesignsToShortlist, deleteShortlistedDesign, getShortlistedRoomDesigns, uploadShortlistedDesignImages } from "../../../controllers/stage controllers/sampledesign contorllers/shortList.controller";
import {  addShortlistedDesigns, deleteShortListedDesign, getAllReferenceTags, getAllSiteImages, getShortlistedReferenceDesigns, getShortlistedRoomDesigns,  } from "../../../controllers/stage controllers/sampledesign contorllers/shortList.controller";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";


const shortlistedDesignRoutes = express.Router();

// shortlistedDesignRoutes.post(
//   "/upload/:projectId/:roomName/:categoryName/:categoryId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   checkPreviousStageCompleted(SiteMeasurementModel),
//   notToUpdateIfStageCompleted(SampleDesignModel),
//   imageUploadToS3.array("file"),
//   processUploadFiles,
//   uploadShortlistedDesignImages
// );



// shortlistedDesignRoutes.post(
//   "/addexising/:projectId/:roomName/:categoryName/:categoryId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   checkPreviousStageCompleted(SiteMeasurementModel),
//   notToUpdateIfStageCompleted(SampleDesignModel),
//   addSelectedDesignsToShortlist
// );


// shortlistedDesignRoutes.delete(
//  "/remove/:projectId/:roomName/:imageId/:categoryId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   checkPreviousStageCompleted(SiteMeasurementModel),
//   notToUpdateIfStageCompleted(SampleDesignModel),
//   deleteShortlistedDesign
// );


// shortlistedDesignRoutes.get(
//   "/getroom/:projectId/:roomName",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   getShortlistedRoomDesigns
// );



shortlistedDesignRoutes.get(
  "/getshortlisteddesigns/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getShortlistedRoomDesigns
);

shortlistedDesignRoutes.post(
  "/upload/:projectId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  addShortlistedDesigns
);

shortlistedDesignRoutes.get(
  "/getsiteimages/:projectId/",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllSiteImages
);

shortlistedDesignRoutes.get(
  "/getreferencedesigns/:organizationId/",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getShortlistedReferenceDesigns
);


shortlistedDesignRoutes.get('/getsuggestedtags', getAllReferenceTags);

shortlistedDesignRoutes.delete(
  "/deletepdf/:id/",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteShortListedDesign
);



export default shortlistedDesignRoutes;
