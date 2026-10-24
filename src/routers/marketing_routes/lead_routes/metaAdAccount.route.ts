// import { Router } from "express";
// import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
// import { getAllMetaAdAccounts ,  getMetaAdAccountById
// ,  upsertMetaAdAccount,  deleteMetaAdAccount,
// getMetaAdAccountByOrgId,
// deleteMetaAdAccountByOrgId} from "../../../controllers/marketing_controllers/lead_controllers/metaAdAccount.controller";



// const MetaAdAccountRoutes = Router();

// MetaAdAccountRoutes.get('/',  multiRoleAuthMiddleware("owner", "CTO", "staff"), getAllMetaAdAccounts);
// MetaAdAccountRoutes.get('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  getMetaAdAccountById);
// MetaAdAccountRoutes.get('/get-by-org/:organizationId',  multiRoleAuthMiddleware("owner", "CTO", "staff"), getMetaAdAccountByOrgId);
// MetaAdAccountRoutes.put('/', multiRoleAuthMiddleware("owner", "CTO", "staff"),  upsertMetaAdAccount);      // match by metaAdAccountId, else create
// MetaAdAccountRoutes.put('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  upsertMetaAdAccount);   // update that exact record
// MetaAdAccountRoutes.delete('/:id', multiRoleAuthMiddleware("owner", "CTO", "staff"),  deleteMetaAdAccount);

// // MetaAdAccountRoutes.put(
// //   "/:organizationId",
// //   multiRoleAuthMiddleware("owner", "CTO", "staff"),
// //   upsertMetaAdAccount
// // );

// MetaAdAccountRoutes.delete(
//   "/:organizationId",
//   multiRoleAuthMiddleware("owner", "CTO", "staff"),
//   deleteMetaAdAccountByOrgId
// );

// export default MetaAdAccountRoutes;





import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import {
  getAllMetaAdAccounts,
  getMetaAdAccountById,
  upsertMetaAdAccount,
  deleteMetaAdAccount,
  getMetaAdAccountByOrgId,
  deleteMetaAdAccountByOrgId,
} from "../../../controllers/marketing_controllers/lead_controllers/metaAdAccount.controller";

const MetaAdAccountRoutes = Router();

MetaAdAccountRoutes.get(
  "/get-by-org/:organizationId",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getMetaAdAccountByOrgId
);

MetaAdAccountRoutes.get(
  "/",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getAllMetaAdAccounts
);

MetaAdAccountRoutes.get(
  "/:id",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  getMetaAdAccountById
);

// Create or match an account by metaAdAccountId
MetaAdAccountRoutes.put(
  "/",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  upsertMetaAdAccount
);

// Update a specific account by its record ID
MetaAdAccountRoutes.put(
  "/:id",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  upsertMetaAdAccount
);

// Delete a specific account belonging to an organization
MetaAdAccountRoutes.delete(
  "/delete-by-org/:organizationId/:id",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  deleteMetaAdAccountByOrgId
);

// Delete by account record ID
MetaAdAccountRoutes.delete(
  "/:id",
  multiRoleAuthMiddleware("owner", "CTO", "staff"),
  deleteMetaAdAccount
);

export default MetaAdAccountRoutes;
