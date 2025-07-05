// routes/payment/paymentConsent.routes.ts

import express from "express";
import { acceptClientConsent, generateConsentLink, toggleConsentRequired } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentConsent contrlollers/paymentConsent.controller"; 
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { getPaymentConfirmation, paymentConfirmationCompletionStatus, setPayementConfirmationStageDeadline } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentMain.controllers";
import { getPaymentSchedule, updateClientApprovalStatus, updateClientNotes, updateDueDate, updateMdApprovalStatus, updateMdNotes } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentSchedule controllers/paymentSchedule.controllers";

// import { createPaymentConfirmationOrder, getPaymentTransaction, verifyPaymentConfirmation } from "../../../controllers/stage controllers/PaymentConfirmation controllers/Payment Transaction/paymentTransaction.controller";

const paymentConsentRoutes = express.Router();

paymentConsentRoutes.get("/getpaymentconfirmation/:projectId",getPaymentConfirmation);

// Example: PUT /api/payment/toggle-consent/:projectId
paymentConsentRoutes.put("/toggleconsent/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),  checkPreviousStageCompleted(CostEstimationModel), toggleConsentRequired);

// step 1
paymentConsentRoutes.post("/generatepayementconsentlink/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), generateConsentLink);
paymentConsentRoutes.post("/acceptconsent/:projectId/:token", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), acceptClientConsent);

// step2

// GET payment schedule
paymentConsentRoutes.get("/getschedule/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),getPaymentSchedule);
// Client approval status
paymentConsentRoutes.put("/clientapprovalstatus/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),checkPreviousStageCompleted(CostEstimationModel), updateClientApprovalStatus);
// Due Date
paymentConsentRoutes.put("/dueDate/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),checkPreviousStageCompleted(CostEstimationModel), updateDueDate);
// Client notes
paymentConsentRoutes.put("/clientnotes/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), updateClientNotes);
// MD approval status
paymentConsentRoutes.put("/mdapprovalstatus/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), updateMdApprovalStatus);
// MD notes
paymentConsentRoutes.put("/mdnotes/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"),checkPreviousStageCompleted(CostEstimationModel), updateMdNotes);


//  STEP 3

// paymentConsentRoutes.post("/createorder/:projectId", multiRoleAuthMiddleware("client"), checkPreviousStageCompleted(CostEstimationModel), createPaymentConfirmationOrder);
// paymentConsentRoutes.post("/verifypayment/:projectId", multiRoleAuthMiddleware("client"), checkPreviousStageCompleted(CostEstimationModel), verifyPaymentConfirmation);
// paymentConsentRoutes.get("/gettransaction/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), getPaymentTransaction);



// COMMON ROUTES
paymentConsentRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), setPayementConfirmationStageDeadline)
paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), paymentConfirmationCompletionStatus)

export default paymentConsentRoutes;
