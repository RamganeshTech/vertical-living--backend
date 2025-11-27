import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { deleteRazorpayConfig, getRazorpayConfig, saveRazorpayConfig } from '../../controllers/RazoryPay_controllers/razorpay.controllers';

const razorpayRoutes = express.Router()

razorpayRoutes.post("/:organizationId", multiRoleAuthMiddleware("owner", "staff", "CTO"), saveRazorpayConfig);


razorpayRoutes.get("/:organizationId",multiRoleAuthMiddleware("owner", "staff", "CTO"), getRazorpayConfig);
razorpayRoutes.delete("/:organizationId",multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteRazorpayConfig);


export default razorpayRoutes;