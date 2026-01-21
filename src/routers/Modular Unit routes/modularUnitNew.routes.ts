import {
    createModularUnitNew,
    getAllModularUnitsNew,
    getModularUnitByIdNew,
    updateModularUnitNew
    , deleteModularUnitNew,
} from "../../controllers/Modular Units Controllers/modularUnitNew.controllers"
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";
import express from 'express';



const modularUnitRoutesNew = express.Router()



modularUnitRoutesNew.post(
    "/create/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.fields([
        { name: "productImages" },
        { name: "2dImages" },
        { name: "3dImages" },
        { name: "cutlistDoc" }
    ]), processUploadFiles,
    createModularUnitNew
);



modularUnitRoutesNew.put(
    "/update/:unitId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.fields([
        { name: "productImages" },
        { name: "2dImages" },
        { name: "3dImages" },
        { name: "cutlistDoc" }
    ]),
    processUploadFiles,
    updateModularUnitNew
);


modularUnitRoutesNew.delete(
    "/delete/:unitId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteModularUnitNew
);

modularUnitRoutesNew.get(
    "/getunits/:unitId",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
    getModularUnitByIdNew
);


modularUnitRoutesNew.get(
    "/getallunits/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
    getAllModularUnitsNew
);


export default modularUnitRoutesNew;

