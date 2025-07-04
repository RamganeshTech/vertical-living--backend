// routes/payment/paymentConsent.routes.ts

import express from "express";
import { acceptClientConsent, generateConsentLink, toggleConsentRequired } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentConsent contrlollers/paymentConsent.controller"; 
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { getPaymentConfirmation, paymentConfirmationCompletionStatus, setPayementConfirmationStageDeadline } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentConsent contrlollers/PaymentMain.controllers";

const paymentConsentRoutes = express.Router();

paymentConsentRoutes.get("/getpayementconfirmation/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client") ,getPaymentConfirmation);

// Example: PUT /api/payment/toggle-consent/:projectId
paymentConsentRoutes.put("/toggleconsent/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), toggleConsentRequired);

// step 1
paymentConsentRoutes.post("/generatepayementconsentlink/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),generateConsentLink);
paymentConsentRoutes.post("/acceptconsent/:projectId/:token", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), acceptClientConsent);



// COMMON ROUTES
paymentConsentRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), setPayementConfirmationStageDeadline)
paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), paymentConfirmationCompletionStatus)

export default paymentConsentRoutes;
