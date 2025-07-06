// src/routes/subscriptionRoutes.ts

import { Router } from "express";
import { startPlanChange, verifySubscriptionPayment } from "../../controllers/SubscriptionPayment Controllers/subscripitonPayment.controllers";
import userAuthenticatedMiddleware from './../../middlewares/userAuthMiddleware';

const subscriptionRoutes = Router();

// ✅ Start a plan change (pick first plan / upgrade / downgrade)
subscriptionRoutes.post("/choosesubscriptionmode", userAuthenticatedMiddleware, startPlanChange);

// ✅ Verify Razorpay payment for upgrades
subscriptionRoutes.post("/verify", verifySubscriptionPayment);

export default subscriptionRoutes;
