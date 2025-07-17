
import express, { RequestHandler }  from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { createUnit, deleteUnit, getAllMixedUnits, getUnits, updateUnit } from '../../controllers/Modular Units Controllers/modularUnit.controller';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';

const modularUnitRoutes = express.Router()



modularUnitRoutes.post(
  "/create/:organizationId/:unitType",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.array("images"), // multiple images
  processUploadFiles,
  createUnit
);



modularUnitRoutes.put(
  "/update/:unitType/:unitId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.array("images"), // multiple images
  processUploadFiles,
  updateUnit
);


modularUnitRoutes.delete(
  "/delete/:organizationId/:unitType/:unitId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteUnit
);

modularUnitRoutes.get(
  "/getunits/:organizationId/:unitType",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
  getUnits
);



modularUnitRoutes.get(
  "/getallunits/:organizationId",
  multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
  getAllMixedUnits
);


export default modularUnitRoutes;
