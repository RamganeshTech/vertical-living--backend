import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { getAllMetaAdAccounts ,  getMetaAdAccountById
,  upsertMetaAdAccount,  deleteMetaAdAccount} from "../../../controllers/marketing_controllers/lead_controllers/metaAdAccount.controller";



const MetaAdAccountRoutes = Router();

MetaAdAccountRoutes.get('/',  multiRoleAuthMiddleware("owner", "CTO", "staff"), getAllMetaAdAccounts);
MetaAdAccountRoutes.get('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  getMetaAdAccountById);
MetaAdAccountRoutes.put('/', multiRoleAuthMiddleware("owner", "CTO", "staff"),  upsertMetaAdAccount);      // match by metaAdAccountId, else create
MetaAdAccountRoutes.put('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  upsertMetaAdAccount);   // update that exact record
MetaAdAccountRoutes.delete('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  deleteMetaAdAccount);

export default MetaAdAccountRoutes;
