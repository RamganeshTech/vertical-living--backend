// routes/commonOrderRoutes.ts
import express from "express";
import { addCommonOrderSubItemToUnitNew,
    //  addCommonSubItemToUnit, createCommonOrderingUnit, deleteCommonOrderingUnit, editCommonOrderingUnit,deleteCommonSubItemFromUnit,updateCommonSubItemInUnit,generateCommonOrderPDFController
     commonOrderMaterialHistoryCompletionStatus,  createCommonOrderProjectName, deleteCommonOrderAllSubUnitsNew, deleteCommonOrderingMaterialImage, deleteCommonOrderPdf, deleteCommonOrderProject, deleteCommonOrderSubItemFromUnitNew, editCommonOrderProject , generateCommonOrderHistoryPDFController, getCommonOrderHistoryMaterial, getSingleCommonOrderedItem, getSingleproject, placeCommonOrderToProcurement, submitCommonOrderMaterial, updateCommonOrderDeliveryLocationDetails, updateCommonOrderPdfStatus, updateCommonOrderShopDetails, updateCommonOrderSubItemInUnitNew,  uploadCommonOrderMaterialImages } from "../../../../controllers/stage controllers/ordering material controller/Common OrderHisotry Controller/commonOrderHistory.controller";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";
import { imageUploadToS3, processUploadFiles } from "../../../../utils/s3Uploads/s3upload";

const commonOrderRoutes = express.Router();


commonOrderRoutes.post(
    "/createcommonproject/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    createCommonOrderProjectName
);


commonOrderRoutes.put(
    "/editcommonproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    editCommonOrderProject
);

commonOrderRoutes.delete(
    "/deletecommonproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteCommonOrderProject
);

//  next all three routes is (not in use)
// commonOrderRoutes.post("/createcommonorder/:id/units", multiRoleAuthMiddleware("owner", "staff", "CTO"), createCommonOrderingUnit);

// commonOrderRoutes.put("/:id/editcommonorder/:unitId", multiRoleAuthMiddleware("owner", "staff", "CTO"), editCommonOrderingUnit);

// commonOrderRoutes.delete("/:id/deletecommonorder/:unitId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteCommonOrderingUnit);

///////////////////////////
// SubItems routes
///////////////////////////



// commonOrderRoutes.post(
//     "/:id/unit/:unitId/addsubitem",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     addCommonSubItemToUnit
// );

// commonOrderRoutes.put(
//     "/:id/unit/:unitId/updatesubitem/:subItemId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     updateCommonSubItemInUnit
// );

// commonOrderRoutes.delete(
//     "/:id/unit/:unitId/deletesubitem/:subItemId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     deleteCommonSubItemFromUnit
// );



//  NEW VERSION

commonOrderRoutes.post("/:id/upload", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), imageUploadToS3.array("files"), processUploadFiles, uploadCommonOrderMaterialImages);
commonOrderRoutes.delete("/:id/deleteimage/:imageId", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",),  deleteCommonOrderingMaterialImage);


commonOrderRoutes.post("/:id/unit/addsubitem", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), addCommonOrderSubItemToUnitNew);
commonOrderRoutes.delete("/:id/unit/deletesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), deleteCommonOrderSubItemFromUnitNew);
commonOrderRoutes.delete("/deleteallsubunits/:id", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), deleteCommonOrderAllSubUnitsNew);
commonOrderRoutes.put("/:id/unit/updatesubitem/:subItemId", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), updateCommonOrderSubItemInUnitNew);



commonOrderRoutes.put("/:id/submitorder", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), submitCommonOrderMaterial);
commonOrderRoutes.put("/:id/:orderItemId/:organizationId/senttoprocurement", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), placeCommonOrderToProcurement);

commonOrderRoutes.get("/:id/:orderItemId/getsingleorderedItem", multiRoleAuthMiddleware("owner", "staff", "CTO","worker",), getSingleCommonOrderedItem);
commonOrderRoutes.patch('/generatelink/:id/:organizationId/:orderItemId', multiRoleAuthMiddleware("owner", "staff", "CTO",),  generateCommonOrderHistoryPDFController)


///////////////////////////
// Delivery & Shop Details
///////////////////////////

commonOrderRoutes.put(
    "/:id/delivery-location",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateCommonOrderDeliveryLocationDetails
);

commonOrderRoutes.put(
    "/:id/shop",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateCommonOrderShopDetails
);

///////////////////////////
// Fetch full order
///////////////////////////

commonOrderRoutes.get(
    "/getalldetails/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
    getCommonOrderHistoryMaterial
);


// used to get the particualr common order based on the id 
commonOrderRoutes.get(
    "/getsingleproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
    getSingleproject
);


commonOrderRoutes.put('/completionstatus/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), commonOrderMaterialHistoryCompletionStatus)

// (NOT IN USE)
// commonOrderRoutes.patch('/generatelink/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), generateCommonOrderPDFController)
// delete the pdf  (NOT IN USE)
commonOrderRoutes.delete('/delete/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), deleteCommonOrderPdf)
// update the status of the project (NOT IN USE)
commonOrderRoutes.patch('/upddatepdfstatus/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   updateCommonOrderPdfStatus)


export default commonOrderRoutes;
