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

// Edit project name
// PUT /api/common-orders/project/:id
commonOrderRoutes.put(
    "/editcoommonproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    editCommonOrderProject
);

// Delete project
// DELETE /api/common-orders/project/:id
commonOrderRoutes.delete(
    "/deletecommonproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteCommonOrderProject
);
// Create a new ordering unit for a project
// POST /api/common-orders/:id/units
commonOrderRoutes.post("/createcommonorder/:id/units", multiRoleAuthMiddleware("owner", "staff", "CTO"), createCommonOrderingUnit);

// Edit an existing ordering unit
// PUT /api/common-orders/:id/units/:unitId
commonOrderRoutes.put("/:id/editcommonorder/:unitId", multiRoleAuthMiddleware("owner", "staff", "CTO"), editCommonOrderingUnit);

// Delete an existing ordering unit
// DELETE /api/common-orders/:id/units/:unitId
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



commonOrderRoutes.get(
    "/getsingleproject/:id",
    multiRoleAuthMiddleware("owner", "staff", "CTO", "client"),
    getSingleproject
);


commonOrderRoutes.put('/completionstatus/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), commonOrderMaterialHistoryCompletionStatus)
commonOrderRoutes.patch('/generatelink/:id', multiRoleAuthMiddleware("owner", "staff", "CTO",), generateCommonOrderPDFController)
commonOrderRoutes.delete('/delete/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",), deleteCommonOrderPdf)
commonOrderRoutes.patch('/upddatepdfstatus/:id/:pdfId', multiRoleAuthMiddleware("owner", "staff", "CTO",),   updateCommonOrderPdfStatus)


export default commonOrderRoutes;
