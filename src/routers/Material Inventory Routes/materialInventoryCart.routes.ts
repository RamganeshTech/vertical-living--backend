import express from 'express';
import { addToCart, getCart, updateCartItemQuantity, removeCartItem, getCartHistory, generateMaterialInventPdf } from '../../controllers/Material Inventory Controller/materialInventoryCart.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';

const materialInventoryCartRoutes = express.Router();

// Cart routes with authentication
materialInventoryCartRoutes
    .post('/add', multiRoleAuthMiddleware('owner', 'staff', 'CTO'), addToCart)
    .get('/get', multiRoleAuthMiddleware('owner', 'staff', 'CTO'), getCart)
    .put('/update-quantity', multiRoleAuthMiddleware('owner', 'staff', 'CTO'), updateCartItemQuantity)
    .delete('/remove-item', multiRoleAuthMiddleware('owner', 'staff', 'CTO'), removeCartItem)
    .get('/history', multiRoleAuthMiddleware('owner', 'staff', 'CTO'), getCartHistory)
    .post("/generatematerial/pdf/:projectId/:id", multiRoleAuthMiddleware('owner', 'staff', 'CTO'), generateMaterialInventPdf );

export default materialInventoryCartRoutes;