// routes/commonOrderRoutes.ts
import express from "express";
import { addCommonSubItemToUnit, commonOrderMaterialHistoryCompletionStatus, createCommonOrderingUnit, createCommonOrderProjectName, deleteCommonOrderingUnit, deleteCommonOrderPdf, deleteCommonOrderProject, deleteCommonSubItemFromUnit, editCommonOrderingUnit, editCommonOrderProject, generateCommonOrderPDFController, getCommonOrderHistoryMaterial, getSingleproject, updateCommonOrderDeliveryLocationDetails, updateCommonOrderPdfStatus, updateCommonOrderShopDetails, updateCommonSubItemInUnit } from "../../../../controllers/stage controllers/ordering material controller/Common OrderHisotry Controller/commonOrderHistory.controller";
import { multiRoleAuthMiddleware } from "../../../../middlewares/multiRoleAuthMiddleware";

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

commonOrderRoutes.post("/createcommonorder/:id/units", multiRoleAuthMiddleware("owner", "staff", "CTO"), createCommonOrderingUnit);

commonOrderRoutes.put("/:id/editcommonorder/:unitId", multiRoleAuthMiddleware("owner", "staff", "CTO"), editCommonOrderingUnit);

commonOrderRoutes.delete("/:id/deletecommonorder/:unitId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteCommonOrderingUnit);

///////////////////////////
// SubItems routes
///////////////////////////



commonOrderRoutes.post(
    "/:id/unit/:unitId/addsubitem",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    addCommonSubItemToUnit
);

commonOrderRoutes.put(
    "/:id/unit/:unitId/updatesubitem/:subItemId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateCommonSubItemInUnit
);

commonOrderRoutes.delete(
    "/:id/unit/:unitId/deletesubitem/:subItemId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteCommonSubItemFromUnit
);

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
commonOrderRoutes.patch('/generatelink/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), generateCommonOrderPDFController)
// delete the pdf 
commonOrderRoutes.delete('/delete/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), deleteCommonOrderPdf)
// update the status of the project
commonOrderRoutes.patch('/upddatepdfstatus/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   updateCommonOrderPdfStatus)


export default commonOrderRoutes;
