import { Router } from 'express';
import {multiRoleAuthMiddleware} from '../../middlewares/multiRoleAuthMiddleware';
import {
  createMaterialInventory,
  updateMaterialInventory,
  deleteMaterialInventory,
  getMaterialInventoryById,
  getMaterialInventories
} from '../../controllers/Material Inventory Controller/materialInventory.controller';

const materialInventoryRoutes = Router();

materialInventoryRoutes.post(
  '/:organizationId/createinventory',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'),
  createMaterialInventory
);

materialInventoryRoutes.put(
  '/:id/updatematerial',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'),
  updateMaterialInventory
);

materialInventoryRoutes.delete(
  '/:id/deletematerial',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'),
  deleteMaterialInventory
);

materialInventoryRoutes.get(
  '/:id/getsingle',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'),
  getMaterialInventoryById
);

materialInventoryRoutes.get(
  '/getallmaterial',
  multiRoleAuthMiddleware('owner', 'staff', 'CTO'),
  getMaterialInventories
);

export default materialInventoryRoutes;
