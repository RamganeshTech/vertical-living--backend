import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { updatePreSalesMaterialItem } from "../../../controllers/Quote Controllers/RateConfig Controller/preSalesRateconfig.contorller";

const PreSalesMaterialRateConfigRoutes = Router();

// Update single item
//  but currently not used anywhere
PreSalesMaterialRateConfigRoutes.put("/items/:itemId", multiRoleAuthMiddleware("owner", "CTO", "staff"), updatePreSalesMaterialItem);

export default PreSalesMaterialRateConfigRoutes;
