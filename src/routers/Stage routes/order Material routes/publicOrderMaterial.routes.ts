import express from 'express';
import { generatePublicOrderMaterialPDFController, getProjectforPublicUsage, publicaddSubItemToUnit, publicdeleteSubItemFromUnit, publicgetSubItem, publicupdateSubItemInUnit } from '../../../controllers/stage controllers/ordering material controller/publicOrderMaterial.controller';

const publicOrderMaterialRoutes = express.Router()

publicOrderMaterialRoutes.post("/:projectId/addsubitem", publicaddSubItemToUnit);

// Delete a subItem by subItemId inside a unit
publicOrderMaterialRoutes.delete("/:projectId/deletesubitem/:subItemId",  publicdeleteSubItemFromUnit);

// Update a subItem by subItemId inside a unit
publicOrderMaterialRoutes.put("/:projectId/updatesubitem/:subItemId",  publicupdateSubItemInUnit);
publicOrderMaterialRoutes.get("/:projectId/getpublicsubitems",  publicgetSubItem);


publicOrderMaterialRoutes.patch('/generatelink/:projectId/:organizationId',   generatePublicOrderMaterialPDFController)
publicOrderMaterialRoutes.get('/getprojects/:organizationId',   getProjectforPublicUsage)



// publicOrderMaterialRoutes.delete("/deleteallsubunits/:projectId",  publicdeleteAllSubUnits);

export default publicOrderMaterialRoutes;