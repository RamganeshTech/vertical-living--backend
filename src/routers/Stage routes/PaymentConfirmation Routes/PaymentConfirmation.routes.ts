// routes/payment/paymentConsent.routes.ts

import express from "express";
import { acceptClientConsent, generateConsentLink, toggleConsentRequired } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentConsent contrlollers/paymentConsent.controller"; 
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { getPaymentConfirmation, paymentConfirmationCompletionStatus, setPayementConfirmationStageDeadline } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentMain.controllers";
import { getPaymentSchedule, updateClientApprovalStatus, updateClientNotes, updateDueDate, updateMdApprovalStatus, updateMdNotes } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentSchedule controllers/paymentSchedule.controllers";
import { createPaymentConfirmationOrder, getPaymentTransaction, verifyPaymentConfirmation } from "../../../controllers/stage controllers/PaymentConfirmation controllers/Payment Transaction/paymentTransaction.controller";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";

// import { createPaymentConfirmationOrder, getPaymentTransaction, verifyPaymentConfirmation } from "../../../controllers/stage controllers/PaymentConfirmation controllers/Payment Transaction/paymentTransaction.controller";

const paymentConsentRoutes = express.Router();

paymentConsentRoutes.get("/getpaymentconfirmation/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), getPaymentConfirmation);

// Example: PUT /api/payment/toggle-consent/:projectId
paymentConsentRoutes.put("/toggleconsent/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff"),  checkPreviousStageCompleted(CostEstimationModel),  notToUpdateIfStageCompleted(PaymentConfirmationModel),  checkIfStaffIsAssignedToStage(PaymentConfirmationModel), toggleConsentRequired);

// step 1
paymentConsentRoutes.post("/generatepayementconsentlink/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff",), checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), generateConsentLink);
paymentConsentRoutes.post("/acceptconsent/:projectId/:token", multiRoleAuthMiddleware("client", "owner"), checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), acceptClientConsent);

// step2

// GET payment schedule
paymentConsentRoutes.get("/getschedule/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), getPaymentSchedule);
// Client approval status
paymentConsentRoutes.put("/clientapprovalstatus/:projectId",multiRoleAuthMiddleware("client", "owner"),checkPreviousStageCompleted(CostEstimationModel),notToUpdateIfStageCompleted(PaymentConfirmationModel), updateClientApprovalStatus);
// Due Date
paymentConsentRoutes.put("/dueDate/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff",),checkPreviousStageCompleted(CostEstimationModel),notToUpdateIfStageCompleted(PaymentConfirmationModel),  checkIfStaffIsAssignedToStage(PaymentConfirmationModel),updateDueDate);
// Client notes
paymentConsentRoutes.put("/clientnotes/:projectId",multiRoleAuthMiddleware("client", "owner"), checkPreviousStageCompleted(CostEstimationModel),notToUpdateIfStageCompleted(PaymentConfirmationModel), updateClientNotes);
// MD approval status
paymentConsentRoutes.put("/mdapprovalstatus/:projectId",multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(CostEstimationModel),notToUpdateIfStageCompleted(PaymentConfirmationModel), updateMdApprovalStatus);
// MD notes
paymentConsentRoutes.put("/mdnotes/:projectId",multiRoleAuthMiddleware( "owner", "CTO", "staff"),checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel),updateMdNotes);


//  STEP 3

paymentConsentRoutes.post("/createorder/:projectId", multiRoleAuthMiddleware("client", "owner" ,"CTO", "staff"), checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), createPaymentConfirmationOrder);
paymentConsentRoutes.post("/verifypayment/:projectId", multiRoleAuthMiddleware("client", "owner" ,"CTO", "staff"), checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), verifyPaymentConfirmation);
paymentConsentRoutes.get("/gettransaction/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(CostEstimationModel), getPaymentTransaction);



// COMMON ROUTES
paymentConsentRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), setPayementConfirmationStageDeadline)
paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(CostEstimationModel), notToUpdateIfStageCompleted(PaymentConfirmationModel), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), paymentConfirmationCompletionStatus)
// paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), paymentConfirmationCompletionStatus)

export default paymentConsentRoutes;
