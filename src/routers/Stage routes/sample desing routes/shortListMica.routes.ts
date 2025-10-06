// import { Router } from 'express';
// import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
// import { addShortlistedMicaDesigns, deleteShortListedMicaDesign, detectObjects, getAllMicaReferenceTags, getAllMicaSiteImages, getShortlistedMicaReferenceDesigns, getShortlistedMicaRoomDesigns } from '../../../controllers/stage controllers/sampledesign contorllers/shortListMica.contorller';
// import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
// import { getAllSiteImages } from '../../../controllers/stage controllers/sampledesign contorllers/shortList.controller';

// const micaDeletectionRoutes = Router();

// // POST /api/detect-areas - Detect objects in uploaded image
// micaDeletectionRoutes.post('/detect-areas',  detectObjects);





// micaDeletectionRoutes.get(
//   "/getshortlisteddesigns/:projectId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   getShortlistedMicaRoomDesigns
// );

// micaDeletectionRoutes.post(
//   "/upload/:projectId",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   addShortlistedMicaDesigns
// );

// micaDeletectionRoutes.get(
//   "/getsiteimages/:projectId/",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   getAllMicaSiteImages
// );

// micaDeletectionRoutes.get(
//   "/getreferencedesigns/:organizationId/",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   getShortlistedMicaReferenceDesigns
// );


// micaDeletectionRoutes.get('/getsuggestedtags', getAllMicaReferenceTags);

// micaDeletectionRoutes.delete(
//   "/deletepdf/:id/",
//   multiRoleAuthMiddleware("owner", "staff", "CTO"),
//   deleteShortListedMicaDesign
// );


// export default micaDeletectionRoutes;